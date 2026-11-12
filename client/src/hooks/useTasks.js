import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/tasks';
import toast from 'react-hot-toast';

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.getTasks(filters),
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => api.getTask(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.updateTaskStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.toggleTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to toggle task');
    },
  });
}
