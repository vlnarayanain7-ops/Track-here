import api from './axios';

export const getTimetableSlots = (params) =>
  api.get('/timetable', { params }).then((r) => r.data);

export const createTimetableSlot = (data) =>
  api.post('/timetable', data).then((r) => r.data);

export const updateTimetableSlot = (id, data) =>
  api.put(`/timetable/${id}`, data).then((r) => r.data);

export const deleteTimetableSlot = (id) =>
  api.delete(`/timetable/${id}`).then((r) => r.data);

