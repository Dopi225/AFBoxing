import { useState, useCallback } from 'react';

/**
 * Gestion corbeille admin (liste + restauration).
 */
export function useEntityTrash(api, { onReload, notifySuccess, notifyError, entityLabel = 'Élément' }) {
  const [view, setView] = useState('active');
  const [trashItems, setTrashItems] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const loadTrash = useCallback(async () => {
    if (!api.listTrash) return;
    setTrashLoading(true);
    try {
      const items = await api.listTrash();
      setTrashItems(Array.isArray(items) ? items : []);
    } catch (err) {
      notifyError?.(err, `Impossible de charger la corbeille.`);
      setTrashItems([]);
    } finally {
      setTrashLoading(false);
    }
  }, [api, notifyError]);

  const handleViewChange = useCallback(
    (next) => {
      setView(next);
      if (next === 'trash') loadTrash();
    },
    [loadTrash]
  );

  const restoreItem = useCallback(
    async (item) => {
      const id = item.id ?? item.price_key ?? item.priceKey;
      if (!api.restore) return;
      setRestoringId(id);
      try {
        await api.restore(id);
        notifySuccess?.(`${entityLabel} restauré${entityLabel.endsWith('e') ? 'e' : ''}.`);
        await Promise.all([onReload?.(), loadTrash()]);
      } catch (err) {
        notifyError?.(err, `Impossible de restaurer ${entityLabel.toLowerCase()}.`);
      } finally {
        setRestoringId(null);
      }
    },
    [api, entityLabel, loadTrash, notifyError, notifySuccess, onReload]
  );

  return {
    view,
    setView: handleViewChange,
    trashItems,
    trashLoading,
    restoringId,
    loadTrash,
    restoreItem,
  };
}
