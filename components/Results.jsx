'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { getDownloadUrl, getZipUrl } from '@/lib/api';

export default function Results({ jobId, results }) {
  if (!results || !results.clips || results.clips.length === 0) return null;

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Generated Clips ({results.clips.length})</h2>
        <a
          href={getZipUrl(jobId)}
          className="btn-primary flex items-center gap-2 text-sm"
          download
        >
          <Download className="w-4 h-4" />
          Download All
        </a>
      </div>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {results.clips.map((clip) => (
          <div key={clip.id} className="bg-dark-700 rounded-lg overflow-hidden">
            <video
              src={getDownloadUrl(jobId, clip.filename)}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{clip.filename}</p>
                <p className="text-xs text-gray-400">{formatDuration(clip.duration)}</p>
              </div>
              <a
                href={getDownloadUrl(jobId, clip.filename)}
                download={clip.filename}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
