import { createStore, get, set, del, keys } from 'idb-keyval';
import api from '@/api/axios';
import { queryClient } from './queryClient';
import { getAccountSession } from './accountSession';
import { belongsToAccount, retryDelay, syncDisposition } from './syncPolicy';

const outboxStore = createStore('th-outbox-v1', 'mutations');
let syncing = false;
let retryTimer;
let controller;
const changed = () => window.dispatchEvent(new CustomEvent('th:outbox-changed'));
export const generateClientId = (prefix = 'client') => `${prefix}_${crypto.randomUUID()}`;
const allItems = async () => (await Promise.all((await keys(outboxStore)).map(k => get(k, outboxStore)))).filter(Boolean);
export function pauseOutbox() {
  clearTimeout(retryTimer);
  controller?.abort();
  changed();
}
export async function enqueueOutbox({ endpoint, method = 'POST', payload = {}, clientId, ownerId = getAccountSession().ownerId }) {
  if (!ownerId) throw new Error('Sign in before saving changes on this device.');
  const finalClientId = clientId || payload.clientId || generateClientId();
  const id = `${ownerId}:${method}:${endpoint}:${finalClientId}`;
  const item = { id, ownerId, clientId: finalClientId, endpoint, method,
    payload: method === 'POST' ? { ...payload, clientId: finalClientId } : payload,
    revision: crypto.randomUUID(), createdAt: Date.now(), attempts: 0, status: 'pending' };
  await set(id, item, outboxStore);
  changed();
  if (navigator.onLine) void flushOutbox().catch(() => {});
  return item;
}
export async function getOutboxState() {
  const { ownerId } = getAccountSession();
  const items = (await allItems()).filter(item => belongsToAccount(item, ownerId));
  return { items, syncing, online: navigator.onLine };
}
export async function getPendingOutboxCount() { return (await getOutboxState()).items.length; }
export async function retryOutbox() {
  const { items } = await getOutboxState();
  for (const item of items) await set(item.id, { ...item, status: 'pending', nextAttempt: 0 }, outboxStore);
  return flushOutbox();
}
export async function flushOutbox() {
  const session = getAccountSession();
  if (syncing || !navigator.onLine || !session.ownerId) return;
  syncing = true;
  controller = new AbortController();
  changed();
  let nextRetry = null;
  try {
    const items = (await allItems()).filter(item => belongsToAccount(item, session.ownerId)).sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      if (getAccountSession().epoch !== session.epoch || controller.signal.aborted) break;
      if (item.status === 'rejected' || item.status === 'auth') continue;
      if (item.nextAttempt > Date.now()) { nextRetry = Math.min(nextRetry ?? Infinity, item.nextAttempt - Date.now()); continue; }
      try {
        await api({ url: item.endpoint, method: item.method, data: item.payload,
          headers: { 'X-Account-Id': session.ownerId }, signal: controller.signal, accountSession: session });
        const latest = await get(item.id, outboxStore);
        if (latest?.revision === item.revision) await del(item.id, outboxStore);
        else nextRetry = 1;
      } catch (error) {
        if (controller.signal.aborted || getAccountSession().epoch !== session.epoch) break;
        const latest = await get(item.id, outboxStore);
        if (latest?.revision !== item.revision) { nextRetry = 1; continue; }
        const status = syncDisposition(error.response?.status);
        const attempts = item.attempts + 1;
        const delay = retryDelay(attempts, error.response?.headers?.['retry-after']);
        await set(item.id, { ...item, attempts, status, nextAttempt: Date.now() + delay,
          error: error.response?.data?.message || (status === 'auth' ? 'Sign in again to sync.' : 'Waiting for a connection.') }, outboxStore);
        if (status === 'auth') break;
        if (status === 'retry') { nextRetry = delay; break; }
      }
    }
    if (getAccountSession().epoch === session.epoch) await queryClient.invalidateQueries();
  } finally {
    syncing = false;
    if (getAccountSession().epoch === session.epoch && nextRetry === null) {
      const pending = (await allItems()).filter(item => belongsToAccount(item, session.ownerId) && ['pending', 'retry'].includes(item.status));
      if (pending.length) nextRetry = Math.max(1, Math.min(...pending.map(item => (item.nextAttempt || 0) - Date.now())));
    }
    changed();
    if (nextRetry !== null && getAccountSession().epoch === session.epoch) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => void flushOutbox().catch(() => {}), nextRetry);
    }
  }
}
window.addEventListener('online', () => void flushOutbox().catch(() => {}));
