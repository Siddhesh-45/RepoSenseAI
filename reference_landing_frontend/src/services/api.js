import axios from 'axios';

const API_BASE = '/api';

export async function analyzeRepo(repoUrl) {
  const response = await axios.post(`${API_BASE}/analyze`, { repoUrl });
  return response.data;
}

export async function searchFiles(query, nodes) {
  const response = await axios.post(`${API_BASE}/search`, { query, nodes });
  return response.data.results;
}
