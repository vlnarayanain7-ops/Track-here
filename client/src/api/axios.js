import axios from 'axios';
import { getAccountSession } from '../lib/accountSession';
import toast from 'react-hot-toast';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('workers.dev') || host.includes('pages.dev')) {
      return '/api';
    }
    // Production cloud deployment fallback: connect directly to live Render backend
    return 'https://trackhere-api.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let csrfToken = null;
const getCookie = (name) => document.cookie
  .split('; ')
  .find((cookie) => cookie.startsWith(`${name}=`))
  ?.split('=').slice(1).join('');

api.interceptors.request.use((config) => {
  if (config.accountSession && config.accountSession.epoch !== getAccountSession().epoch) throw new axios.CanceledError('Account changed; sync paused.');
  if (!['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    const token = getCookie('csrfToken') || csrfToken;
    if (token) config.headers['X-CSRF-Token'] = decodeURIComponent(token);
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const returnedCsrfToken = response.data?.data?.csrfToken;
    if (returnedCsrfToken) csrfToken = returnedCsrfToken;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Do NOT attempt refresh on public auth endpoints (login, register, refresh, me)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/session') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/google') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/me') ||
      originalRequest?.url?.includes('/auth/forgot-password') ||
      originalRequest?.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Do not force a hard window reload here; let React state handle auth redirects
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Auto-retry transient connection blips or 503 startup status once after 600ms
    if (
      originalRequest && !axios.isCancel(error) && !originalRequest?._retryCount &&
      (!error.response || error.response.status === 503 || error.code === 'ERR_NETWORK')
    ) {
      originalRequest._retryCount = 1;
      await new Promise((r) => setTimeout(r, 600));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
