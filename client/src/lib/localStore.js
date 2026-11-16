// src/lib/localStore.js: saved reports live on the DEVICE
import { createStore, get, set, del, keys } from 'idb-keyval';

const reports = createStore('th-reports', 'r');

export const saveReportLocal = (id, blob, summary) =>
  set(id, { blob, summary, savedAt: Date.now() }, reports);

export const deleteReportLocal = (id) => del(id, reports);

export const listReportsLocal = async () =>
  (
    await Promise.all(
      (await keys(reports)).map(async (id) => ({
        id,
        ...(await get(id, reports)),
      }))
    )
  ).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

export const clearReportsLocal = async () => {
  try {
    const allKeys = await keys(reports);
    await Promise.all(allKeys.map((k) => del(k, reports)));
  } catch (e) {
    console.warn('Failed to clear local reports store', e);
  }
};

export default {
  saveReportLocal,
  deleteReportLocal,
  listReportsLocal,
  clearReportsLocal,
};
