import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function TaskCard({
  title,
  description,
  actionLabel,
  onClick,
  variant = 'default',
  icon,
}) {
  return (
    <button
      type="button"
      className={`task-card task-card--${variant}`}
      onClick={onClick}
    >
      <div className="task-card__content">
        {icon ? <div className="task-card__icon">{icon}</div> : null}
        <div>
          <h3 className="task-card__title">{title}</h3>
          {description ? <p className="task-card__desc">{description}</p> : null}
        </div>
      </div>
      {actionLabel ? (
        <span className="task-card__action">
          {actionLabel}
          <FontAwesomeIcon icon={faArrowRight} />
        </span>
      ) : null}
    </button>
  );
}
