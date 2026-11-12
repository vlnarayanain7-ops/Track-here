import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/revisions';
import toast from 'react-hot-toast';

export function useRevisions(params = {}) {
  return useQuery({
    queryKey: ['revisions', params],
    queryFn: () => api.getRevisions(params),
  });
}

export function useDueRevisions() {
  return useQuery({
    queryKey: ['revisions', 'due'],
    queryFn: api.getDueRevisions,
  });
}

export function useCreateRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRevision,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revisions'] });
      toast.success('Revision scheduled!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule revision');
    },
  });
}

export function useCompleteRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }) => api.completeRevision(id, { feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revisions'] });
      toast.success('Revision logged! Next date updated.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to complete revision');
    },
  });
}

export function useDeleteRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRevision,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revisions'] });
      toast.success('Revision removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete revision');
    },
  });
}

