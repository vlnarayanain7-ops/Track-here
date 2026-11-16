import { createStore, get, set, del, keys } from 'idb-keyval';
import api from '@/api/axios';
import { queryClient } from './queryClient';

const outboxStore = createStore('th-outbox-v1', 'mutations');

let isSyncing = false;

export const generateClientId = (prefix = 'client') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export async function enqueueOutbox({ endpoint, method = 'POST', payload = {}, clientId }) {
  const finalClientId = clientId || payload.clientId || generateClientId();
  const id = `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id,
    clientId: finalClientId,
    endpoint,
    method,
    payload: { ...payload, clientId: finalClientId },
    createdAt: Date.now(),
    attempts: 0,
  };
  await set(id, item, outboxStore);
  window.dispatchEvent(new CustomEvent('th:outbox-changed'));
  // Try flushing immediately if online
  if (navigator.onLine) {
    flushOutbox().catch(() => {});
  }
  return item;
}

export async function getPendingOutboxCount() {
  try {
    const allKeys = await keys(outboxStore);
    return allKeys.length;
  } catch {
    return 0;
  }
}

export async function flushOutbox() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  try {
    const allKeys = await keys(outboxStore);
    if (!allKeys.length) {
      isSyncing = false;
      return;
    }

    const items = (await Promise.all(allKeys.map((k) => get(k, outboxStore)))).filter(Boolean);
    items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const item of items) {
      try {
        await api({
          url: item.endpoint,
          method: item.method,
          data: item.payload,
        });
        await del(item.id, outboxStore);
      } catch (err) {
        // If server reports conflict/duplicate, it already has it; safe to remove from outbox
        if (err.response?.status === 409) {
          await del(item.id, outboxStore);
        } else if (!err.response) {
          // Network connection dropped, stop flush loop
          break;
        } else if (err.response?.status >= 400 && err.response?.status < 500) {
          // Client error with bad input; delete so it doesn't block the outbox
          await del(item.id, outboxStore);
        }
      }
    }

    // Invalidate queries so UI reflects synced state
    queryClient.invalidateQueries();
    window.dispatchEvent(new CustomEvent('th:outbox-changed'));
  } finally {
    isSyncing = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOutbox().catch(() => {});
  });
}

export default {
  enqueueOutbox,
  flushOutbox,
  getPendingOutboxCount,
  generateClientId,
};
