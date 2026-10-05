import { NextResponse } from 'next/server';
import jobService from '@/lib/jobService';
import { enqueueJob } from '@/lib/videoProcessor';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      jobId,
      clipDuration,
      aspectRatio,
      resolution,
      autoCrop,
      captionsEnabled,
      captionStyle,
      captionFontSize,
      captionPosition,
      captionLanguage,
      captionColor,
      captionBgOpacity,
      watermarkEnabled,
      watermarkText,
      watermarkPosition,
      watermarkOpacity,
      overlayCleanup,
    } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const job = await jobService.getJob(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const processingStatuses = ['processing', 'transcribing', 'splitting', 'encoding', 'zipping'];
    if (processingStatuses.includes(job.status)) {
      return NextResponse.json({ success: false, error: 'Job is already processing' }, { status: 409 });
    }

    const duration = parseFloat(clipDuration);
    if (!duration || duration < 5 || duration > 600) {
      return NextResponse.json(
        { success: false, error: 'clipDuration must be between 5 and 600 seconds' },
        { status: 400 }
      );
    }

    const validAspects = ['16:9', '9:16', '1:1', '4:5'];
    if (!validAspects.includes(aspectRatio)) {
      return NextResponse.json({ success: false, error: 'Invalid aspectRatio' }, { status: 400 });
    }

    const validRes = ['original', '720p', '1080p'];
    if (!validRes.includes(resolution)) {
      return NextResponse.json({ success: false, error: 'Invalid resolution' }, { status: 400 });
    }

    const settings = {
      clipDuration: duration,
      aspectRatio,
      resolution,
      autoCrop: autoCrop || 'center',
      captionsEnabled: !!captionsEnabled,
      captionStyle: captionStyle || 'classic',
      captionFontSize: parseInt(captionFontSize, 10) || 48,
      captionPosition: captionPosition || 'bottom',
      captionLanguage: captionLanguage || 'en',
      captionColor: captionColor || '&H00FFFFFF',
      captionBgOpacity: parseInt(captionBgOpacity, 10) || 60,
      watermarkEnabled: !!watermarkEnabled,
      watermarkText: (watermarkText || '').trim().slice(0, 64),
      watermarkPosition: watermarkPosition || 'bottom-right',
      watermarkOpacity: Math.max(0, Math.min(100, parseInt(watermarkOpacity, 10) || 60)),
      overlayCleanup: overlayCleanup || { enabled: false },
    };

    await jobService.updateJob(jobId, {
      status: 'queued',
      progress: 1,
      currentStep: 'Queued...',
      settings,
      error: null,
    });

    // Start processing in background (fire-and-forget within the same Node process)
    enqueueJob(jobId, settings);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Processing started',
    });
  } catch (err) {
    logger.error(`Process start error: ${err.message}`);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
