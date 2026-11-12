import api from './axios';

export const getDailyReviews = (params) => api.get('/daily-reviews', { params }).then((r) => r.data);
export const getDailyReview = (date) => api.get(`/daily-reviews/${date}`).then((r) => r.data);
export const createDailyReview = (data) => api.post('/daily-reviews', data).then((r) => r.data);
export const updateDailyReview = (date, data) => api.put(`/daily-reviews/${date}`, data).then((r) => r.data);
