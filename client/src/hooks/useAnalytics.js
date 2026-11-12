import { useQuery } from '@tanstack/react-query';
import * as api from '../api/analytics';

export function useAnalytics(params = {}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => api.getAnalytics(params),
  });
}

export function useStudyTimeAnalytics(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'study-time', params],
    queryFn: () => api.getStudyTimeAnalytics(params),
  });
}

export function useCategoryBreakdown(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'categories', params],
    queryFn: () => api.getCategoryBreakdown(params),
  });
}

export function useWeeklySummary(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'weekly-summary', params],
    queryFn: () => api.getWeeklySummary(params),
  });
}

export function useStreakData() {
  return useQuery({
    queryKey: ['analytics', 'streaks'],
    queryFn: api.getStreakData,
  });
}

export function useHeatmapData(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', params],
    queryFn: () => api.getHeatmapData(params),
  });
}

export function useConsistencyData(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'consistency', params],
    queryFn: () => api.getConsistencyData(params),
  });
}
