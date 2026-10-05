'use client';

import React from 'react';
import { Captions } from 'lucide-react';

const CAPTION_STYLES = [
  { id: 'classic', label: 'Classic', desc: 'White text + dark box' },
  { id: 'bold', label: 'Bold', desc: 'Large bold text' },
  { id: 'social', label: 'Social Media', desc: 'Centered, high contrast' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean shadow only' },
];

export default function CaptionSettings({
  captionsEnabled,
  setCaptionsEnabled,
  captionStyle,
  setCaptionStyle,
  captionFontSize,
  setCaptionFontSize,
  captionPosition,
  setCaptionPosition,
}) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Captions className="w-5 h-5 text-accent" />
          Auto Captions
        </h2>
        <button
          onClick={() => setCaptionsEnabled(!captionsEnabled)}
          className={`relative w-12 h-6 rounded-full transition ${
            captionsEnabled ? 'bg-accent' : 'bg-dark-500'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              captionsEnabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
      {captionsEnabled && (
        <div className="space-y-4">
          <div>
            <label className="label">Style</label>
            <div className="grid grid-cols-2 gap-2">
              {CAPTION_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCaptionStyle(s.id)}
                  className={`p-3 rounded-lg text-left text-sm border ${
                    captionStyle === s.id
                      ? 'border-accent bg-accent/10'
                      : 'border-dark-500 bg-dark-700'
                  }`}
                >
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Font Size</label>
              <input
                type="range"
                min={24}
                max={72}
                value={captionFontSize}
                onChange={(e) => setCaptionFontSize(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">{captionFontSize}px</p>
            </div>
            <div>
              <label className="label">Position</label>
              <select
                value={captionPosition}
                onChange={(e) => setCaptionPosition(e.target.value)}
                className="input"
              >
                <option value="bottom">Bottom</option>
                <option value="center">Center</option>
                <option value="top">Top</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
