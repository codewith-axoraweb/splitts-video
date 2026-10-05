import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs-extra';
import config from '@/lib/config';
import jobService from '@/lib/jobService';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { jobId, filename } = params;
    const job = await jobService.getJob(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Download all (ZIP)
    if (filename === 'all') {
      const zipPath = job.zipPath || path.join(config.outputDir, jobId, 'clips.zip');
      if (!(await fs.pathExists(zipPath))) {
        return NextResponse.json({ success: false, error: 'ZIP not found' }, { status: 404 });
      }
      const buffer = await fs.readFile(zipPath);
      const downloadName = `${(job.originalName || 'clips').replace(/\.[^.]+$/, '')}-clips.zip`;
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    // Single file
    const safeName = path.basename(filename);
    if (safeName !== filename || safeName.includes('..')) {
      return NextResponse.json({ success: false, error: 'Invalid filename' }, { status: 400 });
    }

    const jobOutput = path.join(config.outputDir, jobId);
    const filePath = path.join(jobOutput, safeName);

    if (!(await fs.pathExists(filePath))) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(jobOutput))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const buffer = await fs.readFile(filePath);
    const contentType = safeName.endsWith('.zip') ? 'application/zip' : 'video/mp4';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    logger.error(`Download error: ${err.message}`);
    return NextResponse.json({ success: false, error: 'Download failed' }, { status: 500 });
  }
}
