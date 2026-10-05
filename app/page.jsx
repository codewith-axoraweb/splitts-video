'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, AlertCircle, X, Film } from 'lucide-react';
import UploadBox from '@/components/UploadBox';
import VideoSettings from '@/components/VideoSettings';
import CaptionSettings from '@/components/CaptionSettings';
import WatermarkSettings from '@/components/WatermarkSettings';
import OverlayCleanup from '@/components/OverlayCleanup';
import Progress from '@/components/Progress';
import Results from '@/components/Results';
import {
  uploadVideo,
  startProcess,
  getProcessStatus,
  getResults,
} from '@/lib/api';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [clipDurationMode, setClipDurationMode] = useState('60');
  const [customDuration, setCustomDuration] = useState(90);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('1080p');
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionStyle, setCaptionStyle] = useState('social');
  const [captionFontSize, setCaptionFontSize] = useState(48);
  const [captionPosition, setCaptionPosition] = useState('bottom');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(60);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayX, setOverlayX] = useState(0);
  const [overlayY, setOverlayY] = useState(0);
  const [overlayW, setOverlayW] = useState(200);
  const [overlayH, setOverlayH] = useState(50);
  const [overlayMode, setOverlayMode] = useState('blur');

  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  const clipDuration =
    clipDurationMode === 'custom'
      ? Math.max(5, parseInt(customDuration, 10) || 60)
      : parseInt(clipDurationMode, 10);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleClear = () => {
    setFile(null);
    setJobId(null);
    setMetadata(null);
    setResults(null);
    setError(null);
    setStatus(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const data = await uploadVideo(file, setUploadProgress);
      if (data.success) {
        setJobId(data.jobId);
        setMetadata(data.metadata);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!jobId) return;
    setProcessing(true);
    setError(null);
    setResults(null);
    setProgress(0);
    setCurrentStep('Starting...');
    setStatus('queued');

    try {
      const payload = {
        jobId,
        clipDuration,
        aspectRatio,
        resolution,
        autoCrop: 'center',
        captionsEnabled,
        captionStyle,
        captionFontSize,
        captionPosition,
        captionLanguage: 'en',
        watermarkEnabled,
        watermarkText,
        watermarkPosition,
        watermarkOpacity,
        overlayCleanup: overlayEnabled
          ? {
              enabled: true,
              x: overlayX,
              y: overlayY,
              w: overlayW,
              h: overlayH,
              mode: overlayMode,
            }
          : { enabled: false },
      };

      await startProcess(payload);

      pollRef.current = setInterval(async () => {
        try {
          const st = await getProcessStatus(jobId);
          setStatus(st.status);
          setProgress(st.progress || 0);
          setCurrentStep(st.currentStep || '');
          if (st.error) {
            setError(st.error);
            setProcessing(false);
            clearInterval(pollRef.current);
          }
          if (st.status === 'completed') {
            clearInterval(pollRef.current);
            const res = await getResults(jobId);
            setResults(res);
            setProcessing(false);
            setProgress(100);
            setCurrentStep('Complete');
          }
          if (st.status === 'failed') {
            clearInterval(pollRef.current);
            setProcessing(false);
            setError(st.error || 'Processing failed');
          }
        } catch (e) {
          // keep polling
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start processing');
      setProcessing(false);
    }
  };

  const estimatedClips = metadata ? Math.ceil(metadata.duration / clipDuration) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Video Caption & Clip Splitter</h1>
        <p className="text-gray-400 mt-1">
          Upload a long video, choose duration & aspect ratio, auto-generate captions, and download
          ready-to-post clips.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-300">Error</p>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UploadBox
            file={file}
            setFile={setFile}
            metadata={metadata}
            jobId={jobId}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={handleUpload}
            onClear={handleClear}
          />

          {jobId && (
            <>
              <VideoSettings
                clipDurationMode={clipDurationMode}
                setClipDurationMode={setClipDurationMode}
                customDuration={customDuration}
                setCustomDuration={setCustomDuration}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
                metadata={metadata}
                estimatedClips={estimatedClips}
              />
              <CaptionSettings
                captionsEnabled={captionsEnabled}
                setCaptionsEnabled={setCaptionsEnabled}
                captionStyle={captionStyle}
                setCaptionStyle={setCaptionStyle}
                captionFontSize={captionFontSize}
                setCaptionFontSize={setCaptionFontSize}
                captionPosition={captionPosition}
                setCaptionPosition={setCaptionPosition}
              />
              <WatermarkSettings
                watermarkEnabled={watermarkEnabled}
                setWatermarkEnabled={setWatermarkEnabled}
                watermarkText={watermarkText}
                setWatermarkText={setWatermarkText}
                watermarkPosition={watermarkPosition}
                setWatermarkPosition={setWatermarkPosition}
                watermarkOpacity={watermarkOpacity}
                setWatermarkOpacity={setWatermarkOpacity}
              />
              <OverlayCleanup
                overlayEnabled={overlayEnabled}
                setOverlayEnabled={setOverlayEnabled}
                overlayX={overlayX}
                setOverlayX={setOverlayX}
                overlayY={overlayY}
                setOverlayY={setOverlayY}
                overlayW={overlayW}
                setOverlayW={setOverlayW}
                overlayH={overlayH}
                setOverlayH={setOverlayH}
                overlayMode={overlayMode}
                setOverlayMode={setOverlayMode}
              />

              <button
                onClick={handleGenerate}
                disabled={processing || !jobId}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Generate Clips
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Progress
            processing={processing}
            status={status}
            progress={progress}
            currentStep={currentStep}
          />
          <Results jobId={jobId} results={results} />
          {!processing && !results && jobId && (
            <section className="card p-6 text-center text-gray-400">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Configure settings and click Generate Clips</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
