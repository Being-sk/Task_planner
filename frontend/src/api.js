import axios from 'axios';

// Ensure the base URL ends with /api
let base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
if (!base.endsWith('/api')) {
  base = `${base}/api`;
}

const API_BASE_URL = base;

export const generatePlan = async (prompt) => {
  const response = await axios.post(`${API_BASE_URL}/generate-plan`, { prompt });
  return response.data;
};

export const atomizeTask = async (taskText) => {
  const response = await axios.post(`${API_BASE_URL}/atomize`, { taskText });
  return response.data;
};

export const getResources = async (taskText) => {
  const response = await axios.post(`${API_BASE_URL}/resources`, { taskText });
  return response.data;
};
