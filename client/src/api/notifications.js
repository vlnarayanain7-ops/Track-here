import api from './axios';

export const getNotifications = (params) => api.get('/notifications', { params }).then((r) => r.data);
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllAsRead = () => api.patch('/notifications/read-all').then((r) => r.data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);
export const getUnreadCount = () => api.get('/notifications/unread-count').then((r) => r.data);
export const getVapidKey = () => api.get('/notifications/vapid-key').then((r) => r.data);
export const subscribe = (subscription) => api.post('/notifications/subscribe', subscription).then((r) => r.data);
export const unsubscribe = (endpoint) => api.delete('/notifications/unsubscribe', { data: { endpoint } }).then((r) => r.data);
