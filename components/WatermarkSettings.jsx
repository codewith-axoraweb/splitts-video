'use client';

import React from 'react';
import { Type } from 'lucide-react';

export default function WatermarkSettings({
  watermarkEnabled,
  setWatermarkEnabled,
  watermarkText,
  setWatermarkText,
  watermarkPosition,
  setWatermarkPosition,
  watermarkOpacity,
  setWatermarkOpacity,
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Type className="w-5 h-5 text-accent" />
          Your Watermark
        </h2>
        <button
          onClick={() => setWatermarkEnabled(!watermarkEnabled)}
          className={`relative w-12 h-6 rounded-full transition ${
            watermarkEnabled ? 'bg-accent' : 'bg-dark-500'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              watermarkEnabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
      {watermarkEnabled && (
        <div className="space-y-3">
          <div>
            <label className="label">Channel / Brand Name</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="e.g. WebCoder"
              className="input"
              maxLength={64}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Position</label>
              <select
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value)}
                className="input"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
            <div>
              <label className="label">Opacity ({watermarkOpacity}%)</label>
              <input
                type="range"
                min={10}
                max={100}
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
