import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/dailyPlans';
import toast from 'react-hot-toast';

export function useDailyPlans(params = {}) {
  return useQuery({
    queryKey: ['dailyPlans', params],
    queryFn: () => api.getDailyPlans(params),
  });
}

export function useDailyPlan(date = 'today') {
  return useQuery({
    queryKey: ['dailyPlan', date],
    queryFn: () => api.getDailyPlan(date),
  });
}

export function useCreateDailyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDailyPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyPlan'] });
      qc.invalidateQueries({ queryKey: ['dailyPlans'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save daily plan');
    },
  });
}

