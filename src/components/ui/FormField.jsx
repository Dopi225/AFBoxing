import React, { useId } from 'react';

export default function FormField({
  label,
  name,
  required = false,
  optionalLabel,
  error,
  hint,
  help,
  example,
  children,
  className = ''
}) {
  const errorId = useId();
  const hintId = useId();
  const helpId = useId();
  const exampleId = useId();

  const metaHint = help || hint;
  const describedBy = [
    error ? errorId : null,
    metaHint ? hintId : null,
    example ? exampleId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label ? (
        <label
          htmlFor={name}
          className={`form-label${required ? ' form-label--required' : ''}`}
        >
          {label}
          {!required && optionalLabel !== false ? (
            <span className="form-label--optional">
              {optionalLabel || '(facultatif)'}
            </span>
          ) : null}
        </label>
      ) : null}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            'aria-describedby': describedBy,
            ...(children.props['aria-invalid'] === undefined && error
              ? { 'aria-invalid': true }
              : {}),
          })
        : children}
      {help && !error ? (
        <span id={helpId} className="form-help">
          {help}
        </span>
      ) : null}
      {hint && !error && !help ? (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      ) : null}
      {example && !error ? (
        <span id={exampleId} className="form-example">
          Exemple : {example}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  name,
  type = 'text',
  required,
  optionalLabel,
  error,
  hint,
  help,
  example,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      optionalLabel={optionalLabel}
      error={error}
      hint={hint}
      help={help}
      example={example}
      className={className}
    >
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className={`form-input ${inputClassName}`.trim()}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
    </FormField>
  );
}

export function TextArea({
  label,
  name,
  required,
  optionalLabel,
  error,
  hint,
  help,
  example,
  className = '',
  inputClassName = '',
  rows = 4,
  ...inputProps
}) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      optionalLabel={optionalLabel}
      error={error}
      hint={hint}
      help={help}
      example={example}
      className={className}
    >
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        className={`form-input form-textarea ${inputClassName}`.trim()}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
    </FormField>
  );
}

export function SelectField({
  label,
  name,
  required,
  optionalLabel,
  error,
  hint,
  help,
  example,
  options = [],
  className = '',
  ...selectProps
}) {
  return (
    <FormField
      label={label}
      name={name}
      required={required}
      optionalLabel={optionalLabel}
      error={error}
      hint={hint}
      help={help}
      example={example}
      className={className}
    >
      <select
        id={name}
        name={name}
        required={required}
        className="form-select"
        aria-invalid={error ? true : undefined}
        {...selectProps}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function CheckboxField({
  label,
  name,
  error,
  hint,
  help,
  className = '',
  checkboxClassName = '',
  ...inputProps
}) {
  return (
    <FormField label="" name={name} error={error} hint={hint} help={help} className={`form-group--checkbox ${className}`.trim()}>
      <label htmlFor={name} className="form-checkbox-label">
        <input
          id={name}
          name={name}
          type="checkbox"
          className={`form-checkbox ${checkboxClassName}`.trim()}
          aria-invalid={error ? true : undefined}
          {...inputProps}
        />
        <span>{label}</span>
      </label>
    </FormField>
  );
}
