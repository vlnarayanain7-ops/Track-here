import api from './axios';

export const getTasks = (params) => api.get('/tasks', { params }).then((r) => r.data);
export const getTask = (id) => api.get(`/tasks/${id}`).then((r) => r.data);
export const createTask = (data) => api.post('/tasks', data).then((r) => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data);
export const updateTaskStatus = (id, status) => api.put(`/tasks/${id}/status`, { status }).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);
export const toggleTask = (id) => api.patch(`/tasks/${id}/toggle`).then((r) => r.data);
export const reorderTasks = (data) => api.put('/tasks/reorder', data).then((r) => r.data);
