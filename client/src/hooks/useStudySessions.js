import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/studySessions';
import toast from 'react-hot-toast';

export function useStudySessions(filters = {}) {
  return useQuery({
    queryKey: ['studySessions', filters],
    queryFn: () => api.getStudySessions(filters),
  });
}

export function useStudySession(id) {
  return useQuery({
    queryKey: ['studySession', id],
    queryFn: () => api.getStudySession(id),
    enabled: !!id,
  });
}

export function useCreateStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createStudySession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Study session logged!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create session');
    },
  });
}

export function useUpdateStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateStudySession(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Session updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update session');
    },
  });
}

export function useDeleteStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteStudySession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Session deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete session');
    },
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startTimer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeTimer'] });
      toast.success('Timer started!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    },
  });
}

export function usePauseTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.pauseTimer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeTimer'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pause timer');
    },
  });
}

export function useResumeTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.resumeTimer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeTimer'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resume timer');
    },
  });
}

export function useFinishTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.finishTimer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeTimer'] });
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Timer session saved!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to finish timer');
    },
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey: ['activeTimer'],
    queryFn: api.getActiveTimer,
    refetchInterval: 30000,
  });
}

export function useStudyStats(params = {}) {
  return useQuery({
    queryKey: ['studyStats', params],
    queryFn: () => api.getStudyStats(params),
  });
}
