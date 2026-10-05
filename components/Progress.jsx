'use client';

import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function Progress({ processing, status, progress, currentStep }) {
  if (!processing && !status) return null;

  return (
    <section className="card p-6 sticky top-24">
      <h2 className="text-lg font-semibold mb-4">Processing</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{currentStep || status}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-dark-600 rounded-full h-3">
            <div
              className="bg-accent h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {status === 'completed' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>All clips ready!</span>
          </div>
        )}
        {processing && status !== 'completed' && (
          <div className="flex items-center gap-2 text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Working...</span>
          </div>
        )}
      </div>
    </section>
  );
}
