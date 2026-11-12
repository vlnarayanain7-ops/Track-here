import api from './axios';

export const getProblems = (params) => api.get('/problems', { params }).then((r) => r.data);
export const getProblem = (id) => api.get(`/problems/${id}`).then((r) => r.data);
export const createProblem = (data) => api.post('/problems', data).then((r) => r.data);
export const updateProblem = (id, data) => api.put(`/problems/${id}`, data).then((r) => r.data);
export const deleteProblem = (id) => api.delete(`/problems/${id}`).then((r) => r.data);
export const addAttempt = (id, data) => api.post(`/problems/${id}/attempts`, data).then((r) => r.data);
export const getProblemStats = () => api.get('/problems/stats').then((r) => r.data);
