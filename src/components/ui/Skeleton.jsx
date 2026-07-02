import React from 'react';

const VARIANT_CLASS = {
  text: 'skeleton skeleton--line',
  title: 'skeleton skeleton--title',
  eyebrow: 'skeleton skeleton--eyebrow',
  card: 'skeleton skeleton--card',
  image: 'skeleton skeleton--gallery',
  hero: 'skeleton skeleton--hero',
};

export default function Skeleton({ variant = 'text', className = '', style, 'aria-label': ariaLabel = 'Chargement' }) {
  const base = VARIANT_CLASS[variant] || VARIANT_CLASS.text;
  return (
    <div
      className={`${base} ${className}`.trim()}
      style={style}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    />
  );
}

export function SkeletonGroup({ children, className = '' }) {
  return (
    <div className={`skeleton-group ${className}`.trim()} aria-busy="true">
      {children}
    </div>
  );
}
