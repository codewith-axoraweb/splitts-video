const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');
const logger = require('./logger');

if (config.ffmpeg.path) {
  ffmpeg.setFfmpegPath(config.ffmpeg.path);
}
if (config.ffmpeg.ffprobePath) {
  ffmpeg.setFfprobePath(config.ffmpeg.ffprobePath);
}

class FFmpegService {
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.ffmpeg(`ffprobe error: ${err.message}`);
          return reject(new Error(`Unable to read video metadata: ${err.message}`));
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('No video stream found in file'));
        }

        const duration = parseFloat(metadata.format.duration) || 0;
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const fps = this._parseFps(videoStream.r_frame_rate || videoStream.avg_frame_rate);
        const codec = videoStream.codec_name || 'unknown';
        const bitrate = parseInt(metadata.format.bit_rate || 0, 10);
        const hasAudio = !!audioStream;
        const audioCodec = audioStream ? audioStream.codec_name : null;
        const size = parseInt(metadata.format.size || 0, 10);

        resolve({
          duration,
          width,
          height,
          fps,
          codec,
          bitrate,
          hasAudio,
          audioCodec,
          size,
          format: metadata.format.format_name,
          streams: metadata.streams.length,
        });
      });
    });
  }

  _parseFps(rateStr) {
    if (!rateStr) return 30;
    const parts = String(rateStr).split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      return den ? num / den : num;
    }
    return parseFloat(rateStr) || 30;
  }

  async extractAudio(inputPath, outputPath) {
    await fs.ensureDir(path.dirname(outputPath));
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .output(outputPath)
        .on('start', (cmd) => logger.ffmpeg(`Extract audio: ${cmd}`))
        .on('error', (err) => {
          logger.ffmpeg(`Audio extract failed: ${err.message}`);
          reject(err);
        })
        .on('end', () => {
          logger.ffmpeg(`Audio extracted to ${outputPath}`);
          resolve(outputPath);
        })
        .run();
    });
  }

  getCropScaleFilter(srcWidth, srcHeight, aspectRatio, targetResolution) {
    const targets = {
      '16:9': { '1080p': [1920, 1080], '720p': [1280, 720], original: null },
      '9:16': { '1080p': [1080, 1920], '720p': [720, 1280], original: null },
      '1:1': { '1080p': [1080, 1080], '720p': [720, 720], original: null },
      '4:5': { '1080p': [1080, 1350], '720p': [720, 900], original: null },
    };

    let targetW, targetH;
    if (targetResolution === 'original') {
      const [arW, arH] = aspectRatio.split(':').map(Number);
      const targetAspect = arW / arH;
      const srcAspect = srcWidth / srcHeight;
      if (srcAspect > targetAspect) {
        targetH = srcHeight;
        targetW = Math.round(srcHeight * targetAspect);
      } else {
        targetW = srcWidth;
        targetH = Math.round(srcWidth / targetAspect);
      }
    } else {
      const resMap = targets[aspectRatio];
      if (!resMap || !resMap[targetResolution]) {
        throw new Error(`Unsupported aspect/resolution: ${aspectRatio}/${targetResolution}`);
      }
      [targetW, targetH] = resMap[targetResolution];
    }

    const targetAspect = targetW / targetH;
    const srcAspect = srcWidth / srcHeight;

    let cropW, cropH, cropX, cropY;
    if (srcAspect > targetAspect) {
      cropH = srcHeight;
      cropW = Math.round(srcHeight * targetAspect);
      cropX = Math.round((srcWidth - cropW) / 2);
      cropY = 0;
    } else {
      cropW = srcWidth;
      cropH = Math.round(srcWidth / targetAspect);
      cropX = 0;
      cropY = Math.round((srcHeight - cropH) / 2);
    }

    cropW = cropW - (cropW % 2);
    cropH = cropH - (cropH % 2);
    targetW = targetW - (targetW % 2);
    targetH = targetH - (targetH % 2);

    const filter = `crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${targetW}:${targetH}:flags=lanczos`;
    return { filter, targetW, targetH, cropW, cropH };
  }

  buildAssStyle(style, fontSize = 48, position = 'bottom', textColor = '&H00FFFFFF', bgOpacity = 0.6) {
    const styles = {
      classic: {
        Fontname: 'Arial',
        Fontsize: fontSize,
        PrimaryColour: textColor,
        BackColour: `&H${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}000000`,
        BorderStyle: 3,
        Outline: 0,
        Shadow: 0,
        Alignment: position === 'top' ? 8 : position === 'center' ? 5 : 2,
        MarginV: 40,
      },
      bold: {
        Fontname: 'Arial Black',
        Fontsize: Math.round(fontSize * 1.2),
        PrimaryColour: textColor,
        BackColour: `&H${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}000000`,
        BorderStyle: 3,
        Outline: 0,
        Shadow: 0,
        Alignment: position === 'top' ? 8 : position === 'center' ? 5 : 2,
        MarginV: 50,
      },
      social: {
        Fontname: 'Arial Black',
        Fontsize: Math.round(fontSize * 1.3),
        PrimaryColour: textColor,
        BackColour: `&H${Math.round(Math.min(bgOpacity + 0.2, 1) * 255).toString(16).padStart(2, '0')}000000`,
        BorderStyle: 3,
        Outline: 2,
        Shadow: 1,
        Alignment: 5,
        MarginV: 80,
      },
      minimal: {
        Fontname: 'Arial',
        Fontsize: fontSize,
        PrimaryColour: textColor,
        BackColour: '&H00000000',
        BorderStyle: 1,
        Outline: 2,
        Shadow: 1,
        Alignment: position === 'top' ? 8 : position === 'center' ? 5 : 2,
        MarginV: 30,
      },
    };

    const s = styles[style] || styles.classic;
    return `Style: Default,${s.Fontname},${s.Fontsize},${s.PrimaryColour},&H000000FF,${s.BackColour},&H00000000,0,0,0,0,100,100,0,0,${s.BorderStyle},${s.Outline},${s.Shadow},${s.Alignment},10,10,${s.MarginV},1`;
  }

  async processClip(options) {
    const {
      inputPath,
      outputPath,
      startTime,
      duration,
      srcWidth,
      srcHeight,
      aspectRatio,
      resolution,
      subtitlePath,
      watermarkEnabled,
      watermarkText,
      watermarkPosition,
      watermarkOpacity,
      overlayCleanup,
      hasAudio,
    } = options;

    await fs.ensureDir(path.dirname(outputPath));

    const { filter: cropScale, targetW, targetH } = this.getCropScaleFilter(
      srcWidth,
      srcHeight,
      aspectRatio,
      resolution
    );

    const vfParts = [cropScale];

    if (overlayCleanup && overlayCleanup.enabled) {
      const { x, y, w, h, mode } = overlayCleanup;
      if (mode === 'blur') {
        vfParts.push(
          `split[original][copy];[copy]crop=${w}:${h}:${x}:${y},boxblur=10:2[blurred];[original][blurred]overlay=${x}:${y}`
        );
      } else if (mode === 'pixelate') {
        vfParts.push(
          `split[original][copy];[copy]crop=${w}:${h}:${x}:${y},scale=iw/20:ih/20,scale=${w}:${h}:flags=neighbor[pix];[original][pix]overlay=${x}:${y}`
        );
      } else if (mode === 'mask') {
        vfParts.push(`drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=black@1:t=fill`);
      }
    }

    if (subtitlePath && (await fs.pathExists(subtitlePath))) {
      const escapedSub = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
      vfParts.push(`ass='${escapedSub}'`);
    }

    if (watermarkEnabled && watermarkText && watermarkText.trim()) {
      const posMap = {
        'top-left': { x: 20, y: 20 },
        'top-right': { x: 'w-tw-20', y: 20 },
        'bottom-left': { x: 20, y: 'h-th-20' },
        'bottom-right': { x: 'w-tw-20', y: 'h-th-20' },
      };
      const pos = posMap[watermarkPosition] || posMap['bottom-right'];
      const alpha = Math.max(0, Math.min(1, (watermarkOpacity || 60) / 100));
      const color = `white@${alpha.toFixed(2)}`;
      vfParts.push(
        `drawtext=text='${watermarkText.replace(/'/g, "\\'").replace(/:/g, '\\:')}':fontsize=28:fontcolor=${color}:x=${pos.x}:y=${pos.y}:shadowcolor=black@0.5:shadowx=1:shadowy=1`
      );
    }

    const vf = vfParts.join(',');

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .videoFilters(vf)
        .outputOptions([
          '-c:v',
          config.ffmpeg.useNvenc ? 'h264_nvenc' : 'libx264',
          '-preset',
          config.ffmpeg.useNvenc ? 'p4' : 'medium',
          '-crf',
          '20',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
        ]);

      if (hasAudio) {
        command = command
          .audioCodec('aac')
          .audioBitrate('192k')
          .outputOptions(['-map', '0:a:0?']);
      } else {
        command = command.noAudio();
      }

      command = command.outputOptions(['-map', '0:v:0']);

      command
        .output(outputPath)
        .on('start', (cmd) => {
          logger.ffmpeg(`Processing clip: ${path.basename(outputPath)}`);
          logger.ffmpeg(cmd);
        })
        .on('error', (err, stdout, stderr) => {
          logger.ffmpeg(`Clip encode error: ${err.message}`);
          logger.ffmpeg(stderr);
          reject(new Error(`FFmpeg failed for clip: ${err.message}`));
        })
        .on('end', () => {
          logger.clip(`Created ${path.basename(outputPath)}`);
          resolve({ outputPath, width: targetW, height: targetH });
        })
        .run();
    });
  }

  async writeAssFile(segments, outputPath, styleLine) {
    const header = `[Script Info]
Title: AI Video Studio Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = segments
      .map((seg) => {
        const start = this._secondsToAssTime(seg.start);
        const end = this._secondsToAssTime(seg.end);
        const text = (seg.text || '').replace(/\n/g, '\\N').trim();
        if (!text) return null;
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
      })
      .filter(Boolean)
      .join('\n');

    await fs.writeFile(outputPath, header + events, 'utf8');
    return outputPath;
  }

  _secondsToAssTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  async createZip(clipPaths, zipPath) {
    const archiver = require('archiver');
    await fs.ensureDir(path.dirname(zipPath));

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      output.on('close', () => {
        logger.zip(`ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      for (const clip of clipPaths) {
        archive.file(clip, { name: path.basename(clip) });
      }
      archive.finalize();
    });
  }
}

module.exports = new FFmpegService();
