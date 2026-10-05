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
    return NextResponse.json({
      success: true,
      jobId: job.id,
      originalName: job.originalName,
      metadata: job.metadata,
      status: job.status,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
