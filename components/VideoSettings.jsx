'use client';

import React from 'react';
import { Clock, Ratio, Monitor } from 'lucide-react';
import { formatDuration } from '@/lib/format';

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', desc: 'Landscape', w: 16, h: 9 },
  { id: '9:16', label: '9:16', desc: 'Vertical', w: 9, h: 16 },
  { id: '1:1', label: '1:1', desc: 'Square', w: 1, h: 1 },
  { id: '4:5', label: '4:5', desc: 'Portrait', w: 4, h: 5 },
];

export default function VideoSettings({
  clipDurationMode,
  setClipDurationMode,
  customDuration,
  setCustomDuration,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  metadata,
  estimatedClips,
}) {
  return (
    <>
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          Clip Duration
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {['30', '60', 'custom'].map((m) => (
            <button
              key={m}
              onClick={() => setClipDurationMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                clipDurationMode === m ? 'bg-accent text-white' : 'bg-dark-600 hover:bg-dark-500'
              }`}
            >
              {m === 'custom' ? 'Custom' : `${m}s`}
            </button>
          ))}
        </div>
        {clipDurationMode === 'custom' && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={5}
              max={600}
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="input w-32"
            />
            <span className="text-gray-400">seconds</span>
          </div>
        )}
        {metadata && (
          <p className="text-sm text-gray-400 mt-3">
            Estimated clips: <strong className="text-white">{estimatedClips}</strong> from{' '}
            {formatDuration(metadata.duration)} video
          </p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ratio className="w-5 h-5 text-accent" />
          Aspect Ratio
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.id}
              onClick={() => setAspectRatio(ar.id)}
              className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                aspectRatio === ar.id
                  ? 'border-accent bg-accent/10'
                  : 'border-dark-500 hover:border-dark-400 bg-dark-700'
              }`}
            >
              <div
                className="bg-dark-500 rounded"
                style={{
                  width: ar.w > ar.h ? 48 : (48 * ar.w) / ar.h,
                  height: ar.h > ar.w ? 48 : (48 * ar.h) / ar.w,
                }}
              />
              <span className="font-medium text-sm">{ar.label}</span>
              <span className="text-xs text-gray-400">{ar.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Crop mode: <strong>Center Crop</strong>
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-accent" />
          Output Resolution
        </h2>
        <div className="flex flex-wrap gap-2">
          {['1080p', '720p', 'original'].map((r) => (
            <button
              key={r}
              onClick={() => setResolution(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                resolution === r ? 'bg-accent text-white' : 'bg-dark-600 hover:bg-dark-500'
              }`}
            >
              {r === 'original' ? 'Original' : r}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
