// client/src/lib/queryClient.js: offline-first cache stored in IndexedDB
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 7 * 864e5,
      staleTime: 30_000,
      networkMode: 'offlineFirst',
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: {
    getItem: (k) => get(k),
    setItem: (k, v) => set(k, v),
    removeItem: (k) => del(k),
  },
  key: 'th-cache',
  throttleTime: 2000,
});

export const persistOptions = {
  persister,
  maxAge: 7 * 864e5,
  buster: import.meta.env.VITE_APP_VERSION ?? '1',
  dehydrateOptions: {
    shouldDehydrateQuery: (q) =>
      q.state.status === 'success' && !q.queryKey.includes('admin'),
  },
};

export async function clearQueryCache() {
  try {
    await persister.removeClient();
  } catch (e) {
    console.warn('Failed to remove persister client', e);
  }
  queryClient.clear();
}

export default queryClient;
