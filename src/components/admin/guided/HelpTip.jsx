import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

export default function HelpTip({ text, example, className = '' }) {
  if (!text && !example) return null;

  return (
    <div className={`help-tip ${className}`.trim()} role="note">
      <FontAwesomeIcon icon={faCircleQuestion} className="help-tip__icon" aria-hidden="true" />
      <div className="help-tip__content">
        {text ? <p className="help-tip__text">{text}</p> : null}
        {example ? (
          <p className="help-tip__example">
            <span className="help-tip__example-label">Exemple :</span> {example}
          </p>
        ) : null}
      </div>
    </div>
  );
}
