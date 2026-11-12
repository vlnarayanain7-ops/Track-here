import api from './axios';

export const getRevisions = (params) => api.get('/revisions', { params }).then((r) => r.data);
export const getRevision = (id) => api.get(`/revisions/${id}`).then((r) => r.data);
export const createRevision = (data) => api.post('/revisions', data).then((r) => r.data);
export const updateRevision = (id, data) => api.put(`/revisions/${id}`, data).then((r) => r.data);
export const deleteRevision = (id) => api.delete(`/revisions/${id}`).then((r) => r.data);
export const completeRevision = (id, data) => api.post(`/revisions/${id}/complete`, data).then((r) => r.data);
export const getDueRevisions = () => api.get('/revisions/due').then((r) => r.data);
