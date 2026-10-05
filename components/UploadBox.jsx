'use client';

import React, { useRef } from 'react';
import { Upload, Film, X, Loader2 } from 'lucide-react';
import { formatBytes, formatDuration } from '@/lib/format';

export default function UploadBox({
  file,
  setFile,
  metadata,
  jobId,
  uploading,
  uploadProgress,
  onUpload,
  onClear,
}) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  if (!file) {
    return (
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent" />
          Upload Video
        </h2>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-dark-500 hover:border-accent rounded-xl p-10 text-center cursor-pointer transition-colors bg-dark-700/50"
        >
          <Film className="w-12 h-12 mx-auto text-gray-500 mb-3" />
          <p className="text-lg font-medium">Upload your video</p>
          <p className="text-gray-400 mt-1">Drag & drop or click to browse</p>
          <p className="text-xs text-gray-500 mt-3">MP4, MOV, AVI, MKV, WEBM</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-accent" />
        Upload Video
      </h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg">
          <div className="w-14 h-14 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
            <Film className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-gray-400">{formatBytes(file.size)}</p>
          </div>
          <button onClick={onClear} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {metadata && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-gray-400">Duration</p>
              <p className="font-semibold">{formatDuration(metadata.duration)}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-gray-400">Resolution</p>
              <p className="font-semibold">{metadata.width}×{metadata.height}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-gray-400">FPS</p>
              <p className="font-semibold">{metadata.fps?.toFixed?.(1) ?? metadata.fps}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-gray-400">Audio</p>
              <p className="font-semibold">{metadata.hasAudio ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {!jobId && (
          <button
            onClick={onUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Analyze
              </>
            )}
          </button>
        )}

        {uploading && (
          <div className="w-full bg-dark-600 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
