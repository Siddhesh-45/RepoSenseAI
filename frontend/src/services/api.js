import axios from 'axios';

const API_BASE = '/api';

export async function analyzeRepo(repoUrl) {
  const response = await axios.post(`${API_BASE}/analyze`, { repoUrl });
  return response.data;
}

export async function uploadRepoZip(file) {
  const formData = new FormData();
  formData.append('repoZip', file);
  
  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export async function searchFiles(query, nodes) {
  const response = await axios.post(`${API_BASE}/search`, { query, nodes });
  return response.data.results;
}

/**
 * Ask a natural-language question about the analyzed codebase.
 * Uses RAG: retrieves relevant code chunks from nodes → GPT answers.
 * @returns {{ answer: string, sources: string[] }}
 */
export async function askQuestion(question, nodes) {
  const response = await axios.post(`${API_BASE}/qa`, { question, nodes });
  return response.data; // { answer, sources }
}
