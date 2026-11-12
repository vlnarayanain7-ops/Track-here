import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/timetable';
import toast from 'react-hot-toast';

export function useTimetableSlots(params = {}) {
  return useQuery({
    queryKey: ['timetable', params],
    queryFn: () => api.getTimetableSlots(params),
  });
}

export function useCreateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTimetableSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Scheduled study slot added!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add study slot');
    },
  });
}

export function useUpdateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateTimetableSlot(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Study slot updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update study slot');
    },
  });
}

export function useDeleteTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTimetableSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] });
      toast.success('Study slot removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove study slot');
    },
  });
}

