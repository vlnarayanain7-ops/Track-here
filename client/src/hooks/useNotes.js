import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/notes';
import toast from 'react-hot-toast';
import { enqueueOutbox, generateClientId } from '../lib/outbox';

export function useNotes(params = {}) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => api.getNotes(params),
  });
}

export function useNote(id) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => api.getNote(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note created!');
    },
    onError: async (err, variables) => {
      if (!err.response || !navigator.onLine) {
        await enqueueOutbox({
          endpoint: '/notes',
          method: 'POST',
          payload: variables,
          clientId: generateClientId('note'),
        });
        qc.invalidateQueries({ queryKey: ['notes'] });
        toast.success('Note saved on this device. Changes will sync.');
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to create note');
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateNote(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update note');
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    },
  });
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: api.getFolders,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    },
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete folder');
    },
  });
}
