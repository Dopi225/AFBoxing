import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import Button from '../../ui/Button';

export default function GuidedWizard({
  steps = [],
  isOpen,
  onClose,
  onComplete,
  title,
  isEdit = false,
  canProceed,
  completing = false,
}) {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const step = steps[currentStep - 1];
  const isLast = currentStep === steps.length;
  const stepCanProceed = canProceed ? canProceed(currentStep) : true;

  const handleNext = () => {
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentStep((s) => Math.min(s + 1, steps.length));
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else onClose?.();
  };

  const handleClose = () => {
    setCurrentStep(1);
    onClose?.();
  };

  return (
    <div className="guided-wizard">
      <div className="guided-wizard__header">
        <h2 className="guided-wizard__title">{title}</h2>
        <button type="button" className="guided-wizard__close" onClick={handleClose} aria-label="Fermer">
          ×
        </button>
      </div>

      <StepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        title={step?.title}
        description={step?.description}
      />

      <div className="guided-wizard__body">{step?.content}</div>

      <div className="guided-wizard__footer">
        <Button type="button" variant="outline" onClick={handlePrev}>
          {currentStep === 1 ? 'Annuler' : 'Précédent'}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={!stepCanProceed}
          loading={isLast && completing}
        >
          {isLast ? (isEdit ? 'Enregistrer' : 'Enregistrer') : 'Continuer'}
        </Button>
      </div>
    </div>
  );
}

/** Reset step when wizard reopens */
export function useWizardStep(resetKey) {
  const [step, setStep] = useState(1);
  React.useEffect(() => {
    setStep(1);
  }, [resetKey]);
  return [step, setStep];
}
