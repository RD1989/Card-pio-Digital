import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const isProduction = import.meta.env.PROD;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (isProduction ? '/api' : 'http://localhost:8000/api'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar o token em cada requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com erros globais (ex: 401 não autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
