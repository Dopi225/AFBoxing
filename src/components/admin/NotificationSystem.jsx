import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './NotificationSystem.scss';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const error = useCallback((message, duration) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const warning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  const info = useCallback((message, duration) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ success, error, warning, info, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            index={index}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem = ({ notification, index, onRemove }) => {
  const icons = {
    success: faCheckCircle,
    error: faExclamationCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
  };

  const icon = icons[notification.type] || faInfoCircle;

  return (
    <motion.div
      className={`notification notification--${notification.type}`}
      initial={{ opacity: 0, y: -50, x: 300 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="notification__icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="notification__content">
        <p>{notification.message}</p>
      </div>
      <button
        className="notification__close"
        onClick={() => onRemove(notification.id)}
        aria-label="Fermer"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </motion.div>
  );
};

