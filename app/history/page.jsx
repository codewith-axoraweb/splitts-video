'use client';

import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Download, Film, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getHistory, getZipUrl } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((data) => {
        if (data.success) setJobs(data.jobs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <HistoryIcon className="w-6 h-6 text-accent" />
        Processing History
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No previous jobs yet.</p>
          <Link href="/" className="btn-primary inline-flex mt-4">
            Go to Video Splitter
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{job.originalName || job.id}</p>
                <p className="text-sm text-gray-400">
                  {formatDate(job.createdAt)} · {job.clipsCount || 0} clips ·{' '}
                  <span
                    className={
                      job.status === 'completed'
                        ? 'text-green-400'
                        : job.status === 'failed'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }
                  >
                    {job.status}
                  </span>
                </p>
              </div>
              {job.status === 'completed' && (
                <a
                  href={getZipUrl(job.id)}
                  className="btn-secondary text-sm flex items-center gap-2 shrink-0"
                  download
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
