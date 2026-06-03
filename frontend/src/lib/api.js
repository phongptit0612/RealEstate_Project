import axios from 'axios';

// Shared Axios instance — ensures withCredentials and base URL are set once
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`,
  withCredentials: true,
});

export default api;
