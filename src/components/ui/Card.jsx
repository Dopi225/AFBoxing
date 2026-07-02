import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  icon,
  actions,
  elevated = false,
  interactive = false,
  className = '',
  onClick,
  as: Component = 'div'
}) {
  const classes = [
    'card',
    elevated ? 'card--elevated' : '',
    interactive || onClick ? 'card--interactive' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {(title || icon) && (
        <header className="card__header">
          {icon ? <div className="card__icon">{icon}</div> : null}
          {title ? <h3 className="card__title">{title}</h3> : null}
          {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
        </header>
      )}
      <div className="card__body">{children}</div>
      {actions ? <footer className="card__actions">{actions}</footer> : null}
    </Component>
  );
}
