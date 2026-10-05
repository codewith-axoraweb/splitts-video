# AI Video Studio — Next.js

Same features as the original React + Node app, converted to a single **Next.js** project so you can run it with one command and deploy to **Vercel** (or any Node host).

## Features

- Drag-and-drop video upload (MP4, MOV, AVI, MKV, WEBM)
- Split into 30s / 60s / custom clips
- Aspect ratios: 16:9, 9:16, 1:1, 4:5
- Resolutions: 1080p, 720p, original
- AI captions (OpenAI Whisper or local)
- Caption styles, watermark, overlay cleanup
- Progress tracking + download individual clips or ZIP
- Processing history

## Requirements

| Tool | Notes |
|------|--------|
| Node.js ≥ 18 | Required |
| FFmpeg + FFprobe | Must be in PATH (system install) |
| OpenAI API key | Optional — for cloud Whisper captions |

## Quick Start

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env
# Edit .env — set OPENAI_API_KEY if you want captions

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
WHISPER_PROVIDER=openai   # openai | local | none
OPENAI_API_KEY=sk-...
MAX_FILE_SIZE_MB=2000
MAX_CONCURRENT_JOBS=2
FFMPEG_PATH=              # leave empty if ffmpeg is in PATH
```

## Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel
```

Or connect the GitHub repo in the Vercel dashboard.

### Important Vercel notes

1. **FFmpeg** — Vercel serverless does **not** include FFmpeg. For full video processing you need either:
   - A host that allows long-running Node + system FFmpeg (Railway, Render, Fly.io, VPS), **or**
   - Package a static FFmpeg binary (size limits apply) and use Pro plan for longer timeouts.

2. **Timeouts** — Free/Hobby: ~10s. Pro: up to 60s (or 300s with config). Long videos need a worker-style host.

3. **Storage** — On Vercel, files go to `/tmp` and are ephemeral. For production, plug in S3 / Vercel Blob.

4. **Best for Vercel UI + external worker** — Or deploy this same Next.js app on **Railway / Render** where FFmpeg is available and jobs can run longer.

### Recommended production hosts for video processing

| Host | FFmpeg | Long jobs | Notes |
|------|--------|-----------|--------|
| Railway | Yes (install in Dockerfile) | Yes | Simple |
| Render | Yes | Yes | Free tier available |
| Fly.io | Yes | Yes | Good for Docker |
| VPS (DigitalOcean etc.) | Yes | Yes | Full control |

## Project structure

```
app/
  api/          # API routes (upload, process, download, history)
  history/      # History page
  page.jsx      # Dashboard
  layout.jsx
components/     # UI components
lib/            # ffmpeg, whisper, jobs, config
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |

## License

MIT — same functionality as the original project, converted for Next.js.
