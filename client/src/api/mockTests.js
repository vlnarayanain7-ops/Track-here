import api from './axios';

export const getMockTests = (params) =>
  api.get('/mock-tests', { params }).then((r) => r.data);

export const getMockTestStats = () =>
  api.get('/mock-tests/stats').then((r) => r.data);

export const getMockTest = (id) =>
  api.get(`/mock-tests/${id}`).then((r) => r.data);

export const createMockTest = (data) =>
  api.post('/mock-tests', data).then((r) => r.data);

export const updateMockTest = (id, data) =>
  api.put(`/mock-tests/${id}`, data).then((r) => r.data);

export const deleteMockTest = (id) =>
  api.delete(`/mock-tests/${id}`).then((r) => r.data);

