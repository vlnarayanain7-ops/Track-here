import api from './axios';

export const getNotes = (params) => api.get('/notes', { params }).then((r) => r.data);
export const getNote = (id) => api.get(`/notes/${id}`).then((r) => r.data);
export const createNote = (data) => api.post('/notes', data).then((r) => r.data);
export const updateNote = (id, data) => api.put(`/notes/${id}`, data).then((r) => r.data);
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((r) => r.data);
export const getFolders = () => api.get('/notes/folders').then((r) => r.data);
export const createFolder = (data) => api.post('/notes/folders', data).then((r) => r.data);
export const deleteFolder = (id) => api.delete(`/notes/folders/${id}`).then((r) => r.data);
