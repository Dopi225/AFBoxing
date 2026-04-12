import React from 'react';
import { Link } from 'react-router-dom';
import { OptimizedMotion, fadeInUp } from './OptimizedMotion';

/**
 * SectionHeader
 * Header de section cohérent (titre fort + sous-titre + visuel + CTA).
 * - Ne change pas le fond (contenu), mais professionnalise la forme.
 */
const SectionHeader = ({
  className = '',
  title,
  subtitle,
  eyebrow,
  image,
  align = 'center', // 'center' | 'left'
  tone = 'dark', // 'dark' | 'light'
  compact = false,
  actions = [],
  children,
}) => {
  const style = image ? { '--section-header-image': `url(${image})` } : undefined;

  return (
    <section
      className={[
        'section-header',
        `section-header--${tone}`,
        `section-header--${align}`,
        compact ? 'section-header--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="container" style={{height: 390}}>
        <OptimizedMotion variant={fadeInUp}>
          <div className="section-header__content">
            {eyebrow ? <div className="section-header__eyebrow">{eyebrow}</div> : null}
            <h1 className="section-header__title">{title}</h1>
            {subtitle ? <p className="section-header__subtitle">{subtitle}</p> : null}

            {children ? <div className="section-header__extra">{children}</div> : null}

            {actions?.length ? (
              <div className="section-header__actions">
                {actions.map((action, idx) => {
                  const {
                    label,
                    to,
                    href,
                    onClick,
                    icon,
                    className: actionClassName,
                    ariaLabel,
                  } = action || {};

                  const cls = ['btn', actionClassName || 'btn-primary'].filter(Boolean).join(' ');
                  const content = (
                    <>
                      {icon ? <span className="section-header__actionIcon">{icon}</span> : null}
                      <span>{label}</span>
                    </>
                  );

                  if (to) {
                    return (
                      <Link key={`${to}-${idx}`} to={to} className={cls} aria-label={ariaLabel}>
                        {content}
                      </Link>
                    );
                  }

                  if (href) {
                    return (
                      <a
                        key={`${href}-${idx}`}
                        href={href}
                        className={cls}
                        aria-label={ariaLabel}
                        onClick={onClick}
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <button
                      key={`${label || 'action'}-${idx}`}
                      type="button"
                      className={cls}
                      aria-label={ariaLabel}
                      onClick={onClick}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </OptimizedMotion>
      </div>
    </section>
  );
};

export default SectionHeader;


