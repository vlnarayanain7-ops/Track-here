import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/problems';
import toast from 'react-hot-toast';

export function useProblems(params = {}) {
  return useQuery({
    queryKey: ['problems', params],
    queryFn: () => api.getProblems(params),
  });
}

export function useProblem(id) {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: () => api.getProblem(id),
    enabled: !!id,
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProblem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Problem added!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add problem');
    },
  });
}

export function useUpdateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateProblem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Problem updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update problem');
    },
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProblem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Problem deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete problem');
    },
  });
}

export function useAddAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.addAttempt(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      toast.success('Attempt logged!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to log attempt');
    },
  });
}

export function useProblemStats() {
  return useQuery({
    queryKey: ['problemStats'],
    queryFn: api.getProblemStats,
  });
}
