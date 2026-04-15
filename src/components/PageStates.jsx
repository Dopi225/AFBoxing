import React from 'react';

export function EmptyState({ title = 'Rien pour le moment', children, className = '' }) {
  return (
    <div className={`afb-empty-state ${className}`.trim()} role="status">
      <p className="afb-empty-state__title">{title}</p>
      {children ? <div className="afb-empty-state__text">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ title = 'Une erreur est survenue', message, onRetry, retryLabel = 'Réessayer' }) {
  return (
    <div className="afb-error-state" role="alert">
      <p className="afb-error-state__title">{title}</p>
      {message ? <p className="afb-error-state__text">{message}</p> : null}
      {typeof onRetry === 'function' ? (
        <button type="button" className="btn btn-primary btn-small" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function InlineLoading({ label = 'Chargement…' }) {
  return (
    <p className="public-inline-loading" role="status" aria-live="polite">
      <span className="afb-spinner" aria-hidden="true" />
      {label}
    </p>
  );
}
