import React from 'react';
import Button from './Button';
import Spinner from './Spinner';

export function EmptyState({ title = 'Rien pour le moment', children, icon, className = '', action }) {
  return (
    <div className={`afb-empty-state ui-state ${className}`.trim()} role="status">
      {icon ? <div className="ui-state__icon" aria-hidden="true">{icon}</div> : null}
      <p className="afb-empty-state__title">{title}</p>
      {children ? <div className="afb-empty-state__text">{children}</div> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  retryLabel = 'Réessayer',
  className = ''
}) {
  return (
    <div className={`afb-error-state ui-state ${className}`.trim()} role="alert">
      <p className="afb-error-state__title">{title}</p>
      {message ? <p className="afb-error-state__text">{message}</p> : null}
      {typeof onRetry === 'function' ? (
        <Button variant="primary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Chargement…', className = '' }) {
  return (
    <div className={`afb-loading-state ui-state ${className}`.trim()} role="status" aria-live="polite">
      <Spinner size="md" />
      <span>{label}</span>
    </div>
  );
}

export function InlineLoading({ label = 'Chargement…', className = '' }) {
  return (
    <p className={`public-inline-loading ${className}`.trim()} role="status" aria-live="polite">
      <Spinner size="sm" />
      {label}
    </p>
  );
}
