import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className = ''
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      {breadcrumbs.length > 0 ? (
        <nav className="page-header__breadcrumb" aria-label="Fil d'Ariane">
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label}>
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="page-header__row">
        <div className="page-header__text">
          {title ? <h1 className="page-header__title">{title}</h1> : null}
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
