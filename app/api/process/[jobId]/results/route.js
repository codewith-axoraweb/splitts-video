import { NextResponse } from 'next/server';
import jobService from '@/lib/jobService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { jobId } = params;
    const job = await jobService.getJob(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Job not completed', status: job.status },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      clips: job.clips || [],
      zipUrl: job.zipUrl || `/api/download/${jobId}/all`,
      originalName: job.originalName,
      metadata: job.metadata,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
