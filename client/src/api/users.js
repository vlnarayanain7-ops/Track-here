import api from './axios';

export const getProfile = () => api.get('/users/profile').then((r) => r.data);
export const updateProfile = (data) => api.put('/users/profile', data).then((r) => r.data);
export const updateSettings = (data) => api.put('/users/settings', data).then((r) => r.data);
export const getSettings = () => api.get('/users/settings').then((r) => r.data);
export const changePassword = (data) => api.put('/users/password', data).then((r) => r.data);
export const deleteAccount = (data) => api.delete('/users/me', { data }).then((r) => r.data);
export const importData = (data) => api.post('/users/me/restore', data).then((r) => r.data);
export const exportData = () => api.get('/users/me/export').then((r) => r.data);
