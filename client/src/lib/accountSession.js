let owner = null;
let epoch = 0;
export const getAccountSession = () => ({ ownerId: owner, epoch });
export function setAccountSession(ownerId) {
  const next = ownerId ? String(ownerId) : null;
  if (owner !== next) { owner = next; epoch += 1; }
  return getAccountSession();
}
