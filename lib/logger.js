const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}${stackStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          const stackStr = stack ? `\n${stack}` : '';
          return `[${timestamp}] ${level}: ${message}${stackStr}`;
        })
      ),
    }),
  ],
});

const tags = ['UPLOAD', 'JOB', 'TRANSCRIPTION', 'FFMPEG', 'CLIP', 'ZIP', 'CLEANUP', 'ERROR', 'API'];
tags.forEach((tag) => {
  logger[tag.toLowerCase()] = (msg, meta) => logger.info(`[${tag}] ${msg}`, meta);
});

module.exports = logger;
