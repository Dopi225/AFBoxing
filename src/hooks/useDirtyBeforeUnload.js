import { useEffect } from 'react';

/**
 * Avertit avant fermeture d'onglet si des modifications ne sont pas enregistrées.
 */
export function useDirtyBeforeUnload(isDirty, message = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?') {
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, message]);
}
