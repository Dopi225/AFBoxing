import React from 'react';

const VARIANT_CLASS = {
  info: 'afb-alert--info',
  success: 'afb-alert--success',
  warning: 'afb-alert--warning',
  error: 'afb-alert--error',
};

export default function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  role = 'status',
}) {
  const alertRole = variant === 'error' ? 'alert' : role;

  return (
    <div className={`afb-alert ${VARIANT_CLASS[variant] || ''} ${className}`.trim()} role={alertRole}>
      {title ? <p className="afb-alert__title">{title}</p> : null}
      {children ? <div className="afb-alert__body">{children}</div> : null}
    </div>
  );
}
