import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import './ConfirmDialog.scss';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemLabel,
  consequences = [],
  type = 'warning',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  danger = false
}) => {
  const icon = type === 'danger' ? faExclamationTriangle : faQuestionCircle;

  const bodyMessage = message || (itemLabel
    ? `Êtes-vous sûr de vouloir continuer avec « ${itemLabel} » ?`
    : 'Êtes-vous sûr de vouloir effectuer cette action ?');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlay
      size="sm"
      title={title || 'Confirmation requise'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="confirm-dialog__body">
        <div className="confirm-dialog__icon" data-type={type} aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </div>
        <p>{bodyMessage}</p>
        {consequences.length > 0 ? (
          <div className="confirm-dialog__consequences">
            <p className="confirm-dialog__consequences-title">Conséquences :</p>
            <ul>
              {consequences.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
