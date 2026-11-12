import api from './axios';

export const getDailyPlans = (params) => api.get('/daily-plans', { params }).then((r) => r.data);
export const getDailyPlan = (date) => api.get(`/daily-plans/${date}`).then((r) => r.data);
export const createDailyPlan = (data) => api.post('/daily-plans', data).then((r) => r.data);
export const updateDailyPlan = (date, data) => api.put(`/daily-plans/${date}`, data).then((r) => r.data);
