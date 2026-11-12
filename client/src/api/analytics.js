import api from './axios';

export const getAnalytics = (params) => api.get('/analytics', { params }).then((r) => r.data);
export const getStudyTimeAnalytics = (params) => api.get('/analytics/study-time', { params }).then((r) => r.data);
export const getCategoryBreakdown = (params) => api.get('/analytics/categories', { params }).then((r) => r.data);
export const getWeeklySummary = (params) => api.get('/analytics/weekly-summary', { params }).then((r) => r.data);
export const getStreakData = () => api.get('/analytics/streaks').then((r) => r.data);
export const getHeatmapData = (params) => api.get('/analytics/heatmap', { params }).then((r) => r.data);
export const getConsistencyData = (params) => api.get('/analytics/consistency', { params }).then((r) => r.data);
