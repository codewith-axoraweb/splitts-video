import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import config from '@/lib/config';
import jobService from '@/lib/jobService';
import ffmpegService from '@/lib/ffmpegService';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  try {
    await fs.ensureDir(config.uploadDir);

    const formData = await request.formData();
    const file = formData.get('video');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No video file uploaded' }, { status: 400 });
    }

    const originalName = file.name || 'video.mp4';
    const ext = path.extname(originalName).toLowerCase();

    if (!config.allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type. Allowed: ${config.allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    const maxBytes = config.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${config.maxFileSizeMB} MB` },
        { status: 413 }
      );
    }

    const safeName = `${uuidv4()}${ext}`;
    const filePath = path.join(config.uploadDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    logger.upload(`Received ${originalName} → ${filePath}`);

    let metadata;
    try {
      metadata = await ffmpegService.getVideoMetadata(filePath);
    } catch (err) {
      await fs.remove(filePath).catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Unable to process this video. Please check that the file is valid.' },
        { status: 400 }
      );
    }

    const job = jobService.createJob({
      inputFile: filePath,
      originalName,
      metadata,
      status: 'uploaded',
      progress: 0,
      currentStep: 'Ready',
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      metadata: {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        size: metadata.size,
        hasAudio: metadata.hasAudio,
        codec: metadata.codec,
      },
      originalName,
    });
  } catch (err) {
    logger.error(`Upload error: ${err.message}`);
    return NextResponse.json(
      { success: false, error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
