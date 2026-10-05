const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

let FormDataLib;
try {
  FormDataLib = require('form-data');
} catch {
  FormDataLib = null;
}

class WhisperService {
  constructor() {
    this.provider = config.whisper.provider;
  }

  async transcribe(audioPath, language = 'en') {
    if (this.provider === 'none') {
      logger.transcription('Transcription disabled (provider=none)');
      return [];
    }

    if (!(await fs.pathExists(audioPath))) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    logger.transcription(`Starting transcription with provider=${this.provider}`);

    if (this.provider === 'openai') {
      return this._transcribeOpenAI(audioPath, language);
    }

    if (this.provider === 'local') {
      return this._transcribeLocal(audioPath, language);
    }

    throw new Error(`Unknown WHISPER_PROVIDER: ${this.provider}`);
  }

  async _transcribeOpenAI(audioPath, language) {
    if (!config.whisper.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required when WHISPER_PROVIDER=openai');
    }
    if (!FormDataLib) {
      throw new Error('form-data package is required for OpenAI Whisper. Run: npm install form-data');
    }

    const form = new FormDataLib();
    form.append('file', fs.createReadStream(audioPath), {
      filename: path.basename(audioPath),
      contentType: 'audio/wav',
    });
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'segment');
    if (language) form.append('language', language);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${config.whisper.openaiApiKey}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 600000,
        }
      );

      const segments = (response.data.segments || []).map((s) => ({
        start: s.start,
        end: s.end,
        text: (s.text || '').trim(),
      }));
      logger.transcription(`OpenAI Whisper returned ${segments.length} segments`);
      return segments;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      logger.error(`OpenAI Whisper failed: ${msg}`);
      throw new Error(`Transcription failed: ${msg}`);
    }
  }

  async _transcribeLocal(audioPath, language) {
    const outDir = path.dirname(audioPath);
    const baseName = path.basename(audioPath, path.extname(audioPath));
    const jsonPath = path.join(outDir, `${baseName}.json`);

    const args = [
      audioPath,
      '--model',
      config.whisper.model || 'base',
      '--output_format',
      'json',
      '--output_dir',
      outDir,
      '--language',
      language || 'en',
      '--verbose',
      'False',
    ];

    const cmd = config.whisper.localCmd || 'whisper';

    return new Promise((resolve, reject) => {
      logger.transcription(`Running local: ${cmd} ${args.join(' ')}`);
      const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let stderr = '';
      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', async (code) => {
        if (code !== 0) {
          logger.error(`Local whisper exited ${code}: ${stderr}`);
          return reject(
            new Error(`Local Whisper failed (code ${code}). Is openai-whisper installed?`)
          );
        }

        try {
          let finalJson = jsonPath;
          if (!(await fs.pathExists(jsonPath))) {
            const alt = path.join(outDir, `${baseName}.json`);
            if (await fs.pathExists(alt)) {
              finalJson = alt;
            } else {
              throw new Error('Whisper JSON output not found');
            }
          }
          const data = await fs.readJson(finalJson);
          const segments = (data.segments || []).map((s) => ({
            start: s.start,
            end: s.end,
            text: (s.text || '').trim(),
          }));
          await fs.remove(finalJson).catch(() => {});
          logger.transcription(`Local whisper returned ${segments.length} segments`);
          resolve(segments);
        } catch (e) {
          reject(e);
        }
      });

      proc.on('error', (err) => {
        reject(
          new Error(
            `Failed to spawn whisper: ${err.message}. Install with: pip install openai-whisper`
          )
        );
      });
    });
  }
}

module.exports = new WhisperService();
