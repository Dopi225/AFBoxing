import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../ui/Button';

export default function EmptyStateGuided({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="studio-empty" role="status">
      {icon ? (
        <div className="studio-empty__icon" aria-hidden>
          <FontAwesomeIcon icon={icon} />
        </div>
      ) : null}
      <h3 className="studio-empty__title">{title}</h3>
      {message ? <p className="studio-empty__text">{message}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
