import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
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
let activeSlowRequestsCount = 0;

const getCookie = (name) => document.cookie
  .split('; ')
  .find((cookie) => cookie.startsWith(`${name}=`))
  ?.split('=').slice(1).join('');

api.interceptors.request.use((config) => {
  if (!['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    const token = csrfToken || getCookie('csrfToken');
    if (token) config.headers['X-CSRF-Token'] = decodeURIComponent(token);
  }

  // Cold-start detection timer (4000ms)
  config._coldStartTimer = setTimeout(() => {
    activeSlowRequestsCount++;
    if (activeSlowRequestsCount === 1) {
      toast.loading('Waking up the server, this can take about a minute on free hosting...', {
        id: 'cold-start-banner',
        duration: 45000,
      });
    }
  }, 4000);

  return config;
});

function handleRequestDone(config) {
  if (config?._coldStartTimer) {
    clearTimeout(config._coldStartTimer);
  }
  if (activeSlowRequestsCount > 0) {
    activeSlowRequestsCount--;
    if (activeSlowRequestsCount === 0) {
      toast.dismiss('cold-start-banner');
    }
  }
}

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
    handleRequestDone(response.config);
    const returnedCsrfToken = response.data?.data?.csrfToken;
    if (returnedCsrfToken) csrfToken = returnedCsrfToken;
    return response;
  },
  async (error) => {
    handleRequestDone(error.config);
    const originalRequest = error.config;

    // Do NOT attempt refresh on public auth endpoints (login, register, refresh)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/google') ||
      originalRequest?.url?.includes('/auth/refresh') ||
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

    return Promise.reject(error);
  }
);

export default api;
