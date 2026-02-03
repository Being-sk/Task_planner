import axios from 'axios';

// Use VITE_API_BASE from env or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

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
