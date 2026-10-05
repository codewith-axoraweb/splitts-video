const path = require('path');

// On Vercel, filesystem is ephemeral — use /tmp
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

const baseDir = isVercel
  ? '/tmp/ai-video-studio'
  : path.resolve(process.cwd(), 'data');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isVercel,

  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(baseDir, 'uploads')),
  outputDir: path.resolve(process.env.OUTPUT_DIR || path.join(baseDir, 'output')),
  tempDir: path.resolve(process.env.TEMP_DIR || path.join(baseDir, 'temp')),
  jobsDir: path.resolve(process.env.JOBS_DIR || path.join(baseDir, 'jobs')),

  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '2000', 10),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
  jobExpiryHours: parseInt(process.env.JOB_EXPIRY_HOURS || '24', 10),

  whisper: {
    provider: process.env.WHISPER_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    localCmd: process.env.WHISPER_LOCAL_CMD || 'whisper',
    model: process.env.WHISPER_MODEL || 'base',
  },

  ffmpeg: {
    path: process.env.FFMPEG_PATH || '',
    ffprobePath: process.env.FFPROBE_PATH || '',
    useNvenc: process.env.USE_NVENC === 'true',
  },

  allowedMimeTypes: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/avi',
  ],

  allowedExtensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
};

module.exports = config;
