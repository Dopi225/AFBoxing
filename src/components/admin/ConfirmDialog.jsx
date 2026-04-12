import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import './ConfirmDialog.scss';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'warning', confirmText = 'Confirmer', cancelText = 'Annuler', danger = false }) => {
  if (!isOpen) return null;

  const icon = type === 'danger' ? faExclamationTriangle : faQuestionCircle;

  return (
    <AnimatePresence>
      <div className="confirm-dialog-overlay" onClick={onClose}>
        <motion.div
          className="confirm-dialog"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="confirm-dialog__header">
            <div className="confirm-dialog__icon" data-type={type}>
              <FontAwesomeIcon icon={icon} />
            </div>
            <h3>{title || 'Confirmation requise'}</h3>
          </div>

          <div className="confirm-dialog__body">
            <p>{message || 'Êtes-vous sûr de vouloir effectuer cette action ?'}</p>
          </div>

          <div className="confirm-dialog__footer">
            <button
              type="button"
              className="confirm-dialog__btn confirm-dialog__btn--cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`confirm-dialog__btn confirm-dialog__btn--confirm ${danger ? 'danger' : ''}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;

