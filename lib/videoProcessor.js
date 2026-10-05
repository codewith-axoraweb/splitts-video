const path = require('path');
const fs = require('fs-extra');
const jobService = require('./jobService');
const ffmpegService = require('./ffmpegService');
const whisperService = require('./whisperService');
const { filterAndShiftSegments } = require('./subtitleGenerator');
const config = require('./config');
const logger = require('./logger');

let activeJobs = 0;
const queue = [];

async function processQueue() {
  if (activeJobs >= config.maxConcurrentJobs || queue.length === 0) return;
  activeJobs++;
  const { jobId, settings } = queue.shift();
  try {
    await runJob(jobId, settings);
  } catch (err) {
    logger.error(`Job ${jobId} failed: ${err.message}`);
    await jobService.updateJob(jobId, {
      status: 'failed',
      error: err.message,
      currentStep: 'Failed',
      progress: 0,
    });
  } finally {
    activeJobs--;
    processQueue();
  }
}

function enqueueJob(jobId, settings) {
  queue.push({ jobId, settings });
  processQueue();
}

async function runJob(jobId, settings) {
  const job = await jobService.getJob(jobId);
  if (!job) throw new Error('Job not found');

  const jobTemp = path.join(config.tempDir, jobId);
  const jobOutput = path.join(config.outputDir, jobId);
  await fs.ensureDir(jobTemp);
  await fs.ensureDir(jobOutput);

  try {
    await jobService.updateJob(jobId, {
      status: 'processing',
      progress: 5,
      currentStep: 'Analyzing video...',
      settings,
    });

    const metadata = await ffmpegService.getVideoMetadata(job.inputFile);
    await jobService.updateJob(jobId, { metadata, progress: 10 });

    const { duration, width, height, hasAudio } = metadata;
    const clipDuration = Math.max(1, parseFloat(settings.clipDuration) || 60);
    const totalClips = Math.ceil(duration / clipDuration);

    logger.job(`Job ${jobId}: ${duration.toFixed(1)}s video → ${totalClips} clips of ~${clipDuration}s`);

    let allSegments = [];
    if (settings.captionsEnabled) {
      await jobService.updateJob(jobId, {
        status: 'transcribing',
        progress: 15,
        currentStep: 'Extracting audio for captions...',
      });

      const audioPath = path.join(jobTemp, 'audio.wav');
      try {
        await ffmpegService.extractAudio(job.inputFile, audioPath);

        await jobService.updateJob(jobId, {
          progress: 25,
          currentStep: 'Generating captions with Whisper...',
        });

        allSegments = await whisperService.transcribe(audioPath, settings.captionLanguage || 'en');
        logger.transcription(`Got ${allSegments.length} segments for job ${jobId}`);
      } catch (err) {
        logger.error(`Transcription failed: ${err.message}`);
        throw new Error(
          `Captions were enabled but transcription failed: ${err.message}. Check WHISPER_PROVIDER / OPENAI_API_KEY or local Whisper installation.`
        );
      } finally {
        await fs.remove(audioPath).catch(() => {});
      }
    }

    await jobService.updateJob(jobId, {
      status: 'splitting',
      progress: 30,
      currentStep: `Creating ${totalClips} clips...`,
    });

    const clips = [];
    const clipPaths = [];
    const progressPerClip = totalClips > 0 ? 55 / totalClips : 55;

    for (let i = 0; i < totalClips; i++) {
      const startTime = i * clipDuration;
      const actualDuration = Math.min(clipDuration, duration - startTime);
      if (actualDuration < 1) break;

      const clipId = `clip_${String(i + 1).padStart(3, '0')}`;
      const clipFilename = `${clipId}.mp4`;
      const clipPath = path.join(jobOutput, clipFilename);

      const stepProgress = Math.round(30 + progressPerClip * (i + 0.5));
      await jobService.updateJob(jobId, {
        status: 'encoding',
        progress: Math.min(stepProgress, 88),
        currentStep: `Encoding clip ${i + 1}/${totalClips}...`,
      });

      let subtitlePath = null;
      if (settings.captionsEnabled && allSegments.length > 0) {
        const clipSegments = filterAndShiftSegments(allSegments, startTime, startTime + actualDuration);
        if (clipSegments.length > 0) {
          subtitlePath = path.join(jobTemp, `${clipId}.ass`);
          const styleLine = ffmpegService.buildAssStyle(
            settings.captionStyle || 'classic',
            settings.captionFontSize || 48,
            settings.captionPosition || 'bottom',
            settings.captionColor || '&H00FFFFFF',
            (settings.captionBgOpacity || 60) / 100
          );
          await ffmpegService.writeAssFile(clipSegments, subtitlePath, styleLine);
        }
      }

      let overlayCleanup = null;
      if (settings.overlayCleanup && settings.overlayCleanup.enabled) {
        overlayCleanup = {
          enabled: true,
          x: parseInt(settings.overlayCleanup.x, 10) || 0,
          y: parseInt(settings.overlayCleanup.y, 10) || 0,
          w: parseInt(settings.overlayCleanup.w, 10) || 100,
          h: parseInt(settings.overlayCleanup.h, 10) || 50,
          mode: settings.overlayCleanup.mode || 'blur',
        };
      }

      await ffmpegService.processClip({
        inputPath: job.inputFile,
        outputPath: clipPath,
        startTime,
        duration: actualDuration,
        srcWidth: width,
        srcHeight: height,
        aspectRatio: settings.aspectRatio || '16:9',
        resolution: settings.resolution || '1080p',
        subtitlePath,
        watermarkEnabled: !!settings.watermarkEnabled && !!settings.watermarkText,
        watermarkText: settings.watermarkText || '',
        watermarkPosition: settings.watermarkPosition || 'bottom-right',
        watermarkOpacity: settings.watermarkOpacity || 60,
        overlayCleanup,
        hasAudio,
      });

      if (subtitlePath) await fs.remove(subtitlePath).catch(() => {});

      const clipInfo = {
        id: clipId,
        filename: clipFilename,
        duration: actualDuration,
        startTime,
        url: `/api/download/${jobId}/${clipFilename}`,
      };
      clips.push(clipInfo);
      clipPaths.push(clipPath);
    }

    await jobService.updateJob(jobId, {
      status: 'zipping',
      progress: 90,
      currentStep: 'Creating ZIP archive...',
    });

    const zipPath = path.join(jobOutput, 'clips.zip');
    await ffmpegService.createZip(clipPaths, zipPath);

    await jobService.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Complete',
      clips,
      zipPath,
      zipUrl: `/api/download/${jobId}/all`,
    });

    logger.job(`Job ${jobId} completed with ${clips.length} clips`);
  } catch (err) {
    logger.error(`Processing error job ${jobId}: ${err.message}`, { stack: err.stack });
    await jobService.updateJob(jobId, {
      status: 'failed',
      error: err.message || 'Processing failed',
      currentStep: 'Failed',
    });
    throw err;
  }
}

module.exports = {
  enqueueJob,
  runJob,
};
