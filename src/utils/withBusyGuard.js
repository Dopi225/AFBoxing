/**
 * Garde anti double-soumission : désactive immédiatement et ignore les appels concurrents.
 * @param {() => Promise<unknown>} fn
 * @param {{ busy: boolean, setBusy: (v: boolean) => void }} state
 */
export async function withBusyGuard(fn, { busy, setBusy }) {
  if (busy) return;
  setBusy(true);
  try {
    return await fn();
  } finally {
    setBusy(false);
  }
}
