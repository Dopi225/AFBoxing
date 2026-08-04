import React, { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

/**
 * Liste corbeille avec restauration (règle UX #8).
 */
export default function TrashPanel({
  items = [],
  loading = false,
  emptyMessage = 'La corbeille est vide.',
  getItemLabel = (item) => item.title || item.label || item.name || `#${item.id}`,
  getItemMeta,
  onRestore,
  restoringId = null,
}) {
  if (loading) {
    return <p className="trash-panel__loading">Chargement de la corbeille…</p>;
  }
  if (!items.length) {
    return <p className="trash-panel__empty">{emptyMessage}</p>;
  }
  return (
    <div className="trash-panel">
      <p className="trash-panel__help">
        Les éléments supprimés restent ici 30 jours. Vous pouvez les restaurer à tout moment pendant cette période.
      </p>
      <ul className="trash-panel__list">
        {items.map((item) => {
          const id = item.id ?? item.price_key ?? item.priceKey;
          return (
            <li key={id} className="trash-panel__item">
              <div className="trash-panel__info">
                <strong>{getItemLabel(item)}</strong>
                {getItemMeta ? <span className="trash-panel__meta">{getItemMeta(item)}</span> : null}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={restoringId === id}
                onClick={() => onRestore(item)}
              >
                {restoringId === id ? 'Restauration…' : 'Restaurer'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Onglets Actifs / Corbeille */
export function TrashTabs({ view, onViewChange, activeCount, trashCount }) {
  return (
    <div className="trash-tabs" role="tablist" aria-label="Affichage liste ou corbeille">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'active'}
        className={`trash-tabs__tab ${view === 'active' ? 'active' : ''}`}
        onClick={() => onViewChange('active')}
      >
        Publiés ({activeCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'trash'}
        className={`trash-tabs__tab ${view === 'trash' ? 'active' : ''}`}
        onClick={() => onViewChange('trash')}
      >
        Corbeille ({trashCount})
      </button>
    </div>
  );
}

/** Hook léger pour confirmation suppression bloc contenu */
export function useBlockDeleteConfirm() {
  const [target, setTarget] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const requestDelete = (label, action) => {
    setTarget(label);
    setPendingAction(() => action);
  };

  const confirm = () => {
    pendingAction?.();
    setTarget(null);
    setPendingAction(null);
  };

  const cancel = () => {
    setTarget(null);
    setPendingAction(null);
  };

  const dialog = (
    <ConfirmDialog
      isOpen={!!target}
      onClose={cancel}
      onConfirm={confirm}
      title="Supprimer cet élément ?"
      itemLabel={target}
      consequences={['Le contenu sera retiré du formulaire.', 'Vous pourrez l\'ajouter à nouveau si besoin.']}
      confirmText="Supprimer"
      danger
    />
  );

  return { requestDelete, dialog };
}
