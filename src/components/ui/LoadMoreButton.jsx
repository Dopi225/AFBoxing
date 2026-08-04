import React from 'react';

/** Bouton « Charger plus » pour listes paginées admin. */
export default function LoadMoreButton({
  hasMore,
  loading,
  onClick,
  loadedCount = 0,
  total = 0,
  label = 'Charger plus',
}) {
  if (!hasMore) {
    if (total > 0 && loadedCount >= total) {
      return (
        <p className="load-more-hint" role="status">
          {loadedCount} élément{loadedCount > 1 ? 's' : ''} affiché{loadedCount > 1 ? 's' : ''}
          {total ? ` sur ${total}` : ''}
        </p>
      );
    }
    return null;
  }

  return (
    <div className="load-more-wrap">
      <button type="button" className="btn btn-secondary" onClick={onClick} disabled={loading}>
        {loading ? 'Chargement…' : label}
      </button>
      {total > 0 ? (
        <span className="load-more-hint">
          {loadedCount} / {total}
        </span>
      ) : null}
    </div>
  );
}
