import { enqueueOutbox } from './outbox';
const keyFor = (owner, id) => `th-note-draft:${owner}:${id}`;
export function readNoteDraft(owner, note) {
  try {
    const draft = JSON.parse(localStorage.getItem(keyFor(owner, note._id)) || 'null');
    return draft && draft.updatedAt > Date.parse(note.updatedAt || 0) ? draft : null;
  } catch { return null; }
}
export function saveNoteDraft(owner, id, data) {
  const draft = { ...data, updatedAt: Date.now() };
  localStorage.setItem(keyFor(owner, id), JSON.stringify(draft));
  return draft;
}
export async function queueNoteDraft(owner, id, draft) {
  const { updatedAt, ...payload } = draft;
  await enqueueOutbox({ endpoint: `/notes/${id}`, method: 'PUT', payload, ownerId: owner, clientId: `note_${id}` });
}
