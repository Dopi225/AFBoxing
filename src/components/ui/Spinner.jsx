import React from 'react';

export default function Spinner({ size = 'md', className = '', label }) {
  const classes = ['afb-spinner', `afb-spinner--${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} role={label ? 'status' : undefined} aria-label={label || undefined}>
      <span className="afb-spinner__ring" aria-hidden="true" />
      {label ? <span className="afb-spinner__label">{label}</span> : null}
    </span>
  );
}
