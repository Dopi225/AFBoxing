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
  getBlockedMessage,
  isDirty = false,
  completing = false,
  size = 'lg',
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) setCurrentStep(1);
  }, [isOpen]);

  if (!steps.length) return null;

  const step = steps[currentStep - 1];
  const isLast = currentStep === steps.length;
  const stepCanProceed = canProceed ? canProceed(currentStep) : true;
  const blockedMessage = !stepCanProceed && getBlockedMessage ? getBlockedMessage(currentStep) : '';

  const requestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose?.();
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose?.();
  };

  const handleNext = () => {
    if (isLast) onComplete?.();
    else setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else requestClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={requestClose}
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
        {blockedMessage ? (
          <p className="wizard-blocked-message" role="alert">
            {blockedMessage}
          </p>
        ) : null}
        <div className="guided-wizard__body">{step?.content}</div>
      </Modal>

      {showDiscardConfirm ? (
        <Modal
          isOpen
          onClose={() => setShowDiscardConfirm(false)}
          closeOnOverlay
          size="sm"
          title="Abandonner la saisie ?"
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setShowDiscardConfirm(false)}>
                Continuer la saisie
              </Button>
              <Button type="button" variant="danger" onClick={confirmDiscard}>
                Abandonner
              </Button>
            </>
          }
        >
          <p>Vous avez commencé à remplir ce formulaire. Si vous fermez maintenant, vos modifications seront perdues (sauf brouillon auto-sauvegardé).</p>
        </Modal>
      ) : null}
    </>
  );
}
