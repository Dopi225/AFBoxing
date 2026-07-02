import React from 'react';

export default function StepIndicator({ currentStep, totalSteps, title, description }) {
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className="step-indicator" aria-live="polite">
      {totalSteps > 1 ? (
        <div
          className="step-indicator__dots"
          role="list"
          aria-label={`Étape ${currentStep} sur ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNum = index + 1;
            const state =
              stepNum < currentStep ? 'done' : stepNum === currentStep ? 'current' : 'pending';
            return (
              <span
                key={stepNum}
                role="listitem"
                className={`step-indicator__dot step-indicator__dot--${state}`}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={`Étape ${stepNum}${state === 'done' ? ', terminée' : state === 'current' ? ', en cours' : ''}`}
              />
            );
          })}
        </div>
      ) : null}
      <div className="step-indicator__header">
        <span className="step-indicator__count">
          Étape {currentStep} sur {totalSteps}
        </span>
        {title ? <h3 className="step-indicator__title">{title}</h3> : null}
      </div>
      <div
        className="step-indicator__bar"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Étape ${currentStep} sur ${totalSteps}`}
      >
        <div className="step-indicator__fill" style={{ width: `${progress}%` }} />
      </div>
      {description ? <p className="step-indicator__desc">{description}</p> : null}
    </div>
  );
}
