import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/dailyReviews';
import toast from 'react-hot-toast';

export function useDailyReviews(params = {}) {
  return useQuery({
    queryKey: ['dailyReviews', params],
    queryFn: () => api.getDailyReviews(params),
  });
}

export function useDailyReview(date = 'today') {
  return useQuery({
    queryKey: ['dailyReview', date],
    queryFn: () => api.getDailyReview(date),
  });
}

export function useCreateDailyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDailyReview,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyReview'] });
      qc.invalidateQueries({ queryKey: ['dailyReviews'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save daily review');
    },
  });
}

