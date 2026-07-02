import React, { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import StepIndicator from './StepIndicator';

/**
 * Modale avec formulaire guidé en plusieurs étapes.
 */
export default function WizardModal({
  isOpen,
  onClose,
  title,
  steps = [],
  onComplete,
  isEdit = false,
  canProceed,
  completing = false,
  size = 'lg',
}) {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isOpen) setCurrentStep(1);
  }, [isOpen]);

  if (!steps.length) return null;

  const step = steps[currentStep - 1];
  const isLast = currentStep === steps.length;
  const stepCanProceed = canProceed ? canProceed(currentStep) : true;

  const handleNext = () => {
    if (isLast) onComplete?.();
    else setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlay={false}
      size={size}
      className="admin-form-modal"
      title={title}
      footer={
        <>
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
            {isLast ? 'Enregistrer' : 'Continuer'}
          </Button>
        </>
      }
    >
      <StepIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        title={step?.title}
        description={step?.description}
      />
      <div className="guided-wizard__body">{step?.content}</div>
    </Modal>
  );
}
