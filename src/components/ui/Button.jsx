import React from 'react';

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'white'];
const SIZES = ['sm', 'md', 'lg'];

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  as: Component = 'button',
  ...props
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'primary';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const classes = [
    safeVariant === 'primary' ? 'btn-primary' : `btn-${safeVariant}`,
    'btn',
    sizeClass,
    fullWidth ? 'btn-full' : '',
    loading ? 'is-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' ? icon : null}
      {children}
      {icon && iconPosition === 'right' ? icon : null}
    </>
  );

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      {...props}
    >
      {content}
    </Component>
  );
}
