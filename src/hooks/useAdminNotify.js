import { useCallback } from 'react';
import { useNotifications } from '../components/admin/NotificationSystem';
import { toAdminErrorMessage } from '../utils/adminFieldErrors';
import { logTechnicalError } from '../utils/userFacingError';

/**
 * Notifications admin avec messages utilisateur (pas de jargon technique).
 */
export function useAdminNotify(context = 'admin') {
  const { success, error, warning, info, removeNotification } = useNotifications();

  const notifySuccess = useCallback(
    (message, duration) => success(message, duration),
    [success]
  );

  const notifyError = useCallback(
    (err, fallback) => {
      logTechnicalError(context, err);
      const msg = typeof err === 'string' ? err : toAdminErrorMessage(err, fallback);
      return error(msg);
    },
    [context, error]
  );

  const notifyWarning = useCallback(
    (message, duration) => warning(message, duration),
    [warning]
  );

  const notifyInfo = useCallback(
    (message, duration) => info(message, duration),
    [info]
  );

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    removeNotification,
  };
}
