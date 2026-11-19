import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/api/axios';

export function useRewardsMe() {
  return useQuery({
    queryKey: ['rewards', 'me'],
    queryFn: async () => {
      const res = await axios.get('/rewards/me');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useSubmitProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post('/rewards/proof', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'me'] });
    },
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (address) => {
      const res = await axios.post('/rewards/claim', address);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'me'] });
    },
  });
}

export function useWeeklyReport(start) {
  return useQuery({
    queryKey: ['reports', 'weekly', start],
    queryFn: async () => {
      const res = await axios.get('/reports/weekly', { params: { start } });
      return res.data;
    },
    enabled: Boolean(start),
    staleTime: 60_000,
  });
}

export default {
  useRewardsMe,
  useSubmitProof,
  useClaimReward,
  useWeeklyReport,
};
