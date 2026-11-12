import api from './axios';

export const login = (data) => api.post('/auth/login', data).then((r) => r.data);
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const logout = () => api.post('/auth/logout').then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data).then((r) => r.data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data).then((r) => r.data);
export const refreshToken = () => api.post('/auth/refresh').then((r) => r.data);
export const getCsrfToken = () => api.get('/auth/csrf').then((r) => r.data);
