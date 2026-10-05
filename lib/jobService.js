const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const logger = require('./logger');

class JobService {
  constructor() {
    this.jobs = new Map();
    this._ensureDirs();
  }

  async _ensureDirs() {
    await fs.ensureDir(config.uploadDir);
    await fs.ensureDir(config.outputDir);
    await fs.ensureDir(config.tempDir);
    await fs.ensureDir(config.jobsDir);
  }

  createJob(initialData = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'uploaded',
      progress: 0,
      currentStep: 'Ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inputFile: null,
      originalName: null,
      metadata: null,
      settings: null,
      clips: [],
      zipPath: null,
      zipUrl: null,
      error: null,
      ...initialData,
    };
    this.jobs.set(jobId, job);
    this.persistJob(job);
    logger.job(`Created job ${jobId}`);
    return job;
  }

  getJob(jobId) {
    if (this.jobs.has(jobId)) {
      return this.jobs.get(jobId);
    }
    return this.loadJob(jobId);
  }

  async loadJob(jobId) {
    const jobPath = path.join(config.jobsDir, `${jobId}.json`);
    if (await fs.pathExists(jobPath)) {
      const job = await fs.readJson(jobPath);
      this.jobs.set(jobId, job);
      return job;
    }
    return null;
  }

  async updateJob(jobId, updates) {
    let job = this.getJob(jobId);
    if (!job) {
      job = await this.loadJob(jobId);
    }
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    this.jobs.set(jobId, job);
    await this.persistJob(job);
    return job;
  }

  async persistJob(job) {
    await fs.ensureDir(config.jobsDir);
    const jobPath = path.join(config.jobsDir, `${job.id}.json`);
    await fs.writeJson(jobPath, job, { spaces: 2 });
  }

  async listJobs(limit = 50) {
    await fs.ensureDir(config.jobsDir);
    const files = await fs.readdir(config.jobsDir);
    const jobs = [];
    for (const file of files.filter((f) => f.endsWith('.json')).slice(0, limit * 2)) {
      try {
        const job = await fs.readJson(path.join(config.jobsDir, file));
        jobs.push({
          id: job.id,
          originalName: job.originalName,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          clipsCount: job.clips ? job.clips.length : 0,
        });
      } catch (e) {
        // skip corrupt
      }
    }
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  }

  async cleanupExpiredJobs() {
    const expiryMs = config.jobExpiryHours * 60 * 60 * 1000;
    const now = Date.now();
    await fs.ensureDir(config.jobsDir);
    const files = await fs.readdir(config.jobsDir);
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      try {
        const jobPath = path.join(config.jobsDir, file);
        const job = await fs.readJson(jobPath);
        if (now - new Date(job.createdAt).getTime() > expiryMs) {
          await this.cleanupJobFiles(job);
          await fs.remove(jobPath);
          this.jobs.delete(job.id);
          logger.cleanup(`Expired job ${job.id} removed`);
        }
      } catch (e) {
        logger.error(`Cleanup error for ${file}: ${e.message}`);
      }
    }
  }

  async cleanupJobFiles(job) {
    try {
      if (job.inputFile && (await fs.pathExists(job.inputFile))) {
        await fs.remove(job.inputFile);
      }
      const jobTemp = path.join(config.tempDir, job.id);
      if (await fs.pathExists(jobTemp)) {
        await fs.remove(jobTemp);
      }
      const jobOutput = path.join(config.outputDir, job.id);
      if (await fs.pathExists(jobOutput)) {
        await fs.remove(jobOutput);
      }
    } catch (e) {
      logger.error(`File cleanup failed for job ${job.id}: ${e.message}`);
    }
  }
}

// Singleton
const jobService = new JobService();
module.exports = jobService;
