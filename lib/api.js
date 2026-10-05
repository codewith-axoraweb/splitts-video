import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
});

export async function uploadVideo(file, onProgress) {
  const formData = new FormData();
  formData.append('video', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data;
}

export async function getVideoInfo(jobId) {
  const res = await api.get(`/video/${jobId}`);
  return res.data;
}

export async function startProcess(payload) {
  const res = await api.post('/process', payload);
  return res.data;
}

export async function getProcessStatus(jobId) {
  const res = await api.get(`/process/${jobId}/status`);
  return res.data;
}

export async function getResults(jobId) {
  const res = await api.get(`/process/${jobId}/results`);
  return res.data;
}

export async function getHistory() {
  const res = await api.get('/history');
  return res.data;
}

export function getDownloadUrl(jobId, filename) {
  return `/api/download/${jobId}/${filename}`;
}

export function getZipUrl(jobId) {
  return `/api/download/${jobId}/all`;
}

export default api;
