'use client';

import React from 'react';
import { Eraser } from 'lucide-react';

export default function OverlayCleanup({
  overlayEnabled,
  setOverlayEnabled,
  overlayX,
  setOverlayX,
  overlayY,
  setOverlayY,
  overlayW,
  setOverlayW,
  overlayH,
  setOverlayH,
  overlayMode,
  setOverlayMode,
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eraser className="w-5 h-5 text-accent" />
          Remove Existing Overlay
        </h2>
        <button
          onClick={() => setOverlayEnabled(!overlayEnabled)}
          className={`relative w-12 h-6 rounded-full transition ${
            overlayEnabled ? 'bg-accent' : 'bg-dark-500'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              overlayEnabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Manual region-based cleanup (blur / pixelate / mask). For videos you own or have permission to edit.
      </p>
      {overlayEnabled && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">X</label>
            <input
              type="number"
              value={overlayX}
              onChange={(e) => setOverlayX(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Y</label>
            <input
              type="number"
              value={overlayY}
              onChange={(e) => setOverlayY(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Width</label>
            <input
              type="number"
              value={overlayW}
              onChange={(e) => setOverlayW(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Height</label>
            <input
              type="number"
              value={overlayH}
              onChange={(e) => setOverlayH(Number(e.target.value))}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Mode</label>
            <select
              value={overlayMode}
              onChange={(e) => setOverlayMode(e.target.value)}
              className="input"
            >
              <option value="blur">Blur</option>
              <option value="pixelate">Pixelate</option>
              <option value="mask">Black Mask</option>
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
