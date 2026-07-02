import React from 'react';

const VARIANTS = {
  default: 'badge--default',
  success: 'badge--success',
  warning: 'badge--warning',
  error: 'badge--error',
  info: 'badge--info'
};

export default function Badge({ children, variant = 'default', className = '' }) {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
