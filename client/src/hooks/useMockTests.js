import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/mockTests';
import toast from 'react-hot-toast';

export function useMockTests(params = {}) {
  return useQuery({
    queryKey: ['mockTests', params],
    queryFn: () => api.getMockTests(params),
  });
}

export function useMockTestStats() {
  return useQuery({
    queryKey: ['mockTests', 'stats'],
    queryFn: () => api.getMockTestStats(),
  });
}

export function useCreateMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createMockTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mockTests'] });
      toast.success('Mock test scorecard logged!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to log mock test');
    },
  });
}

export function useUpdateMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateMockTest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mockTests'] });
      toast.success('Mock test updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update mock test');
    },
  });
}

export function useDeleteMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteMockTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mockTests'] });
      toast.success('Mock test deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete mock test');
    },
  });
}

