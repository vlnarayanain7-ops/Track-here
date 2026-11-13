import api from './axios';

export const getStudySessions = (params) => api.get('/study-sessions', { params }).then((r) => r.data);
export const getStudySession = (id) => api.get(`/study-sessions/${id}`).then((r) => r.data);
export const createStudySession = (data) => api.post('/study-sessions', data).then((r) => r.data);
export const updateStudySession = (id, data) => api.put(`/study-sessions/${id}`, data).then((r) => r.data);
export const deleteStudySession = (id) => api.delete(`/study-sessions/${id}`).then((r) => r.data);
export const startTimer = (data) => api.post('/study-sessions/timer/start', data).then((r) => r.data);
export const pauseTimer = (id) => api.post(`/study-sessions/timer/${id}/pause`).then((r) => r.data);
export const resumeTimer = (id) => api.post(`/study-sessions/timer/${id}/resume`).then((r) => r.data);
export const finishTimer = (id, data) => api.post(`/study-sessions/timer/${id}/finish`, data).then((r) => r.data);
export const cancelTimer = () => api.post('/study-sessions/timer/cancel').then((r) => r.data);
export const getActiveTimer = () => api.get('/study-sessions/timer/active').then((r) => r.data);
export const getStudyStats = (params) => api.get('/study-sessions/stats', { params }).then((r) => r.data);
