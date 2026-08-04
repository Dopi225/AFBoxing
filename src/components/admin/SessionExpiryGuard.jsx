import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTokenExpiresAt, clearSession, getToken } from '../../services/apiService';

const WARN_MS = 5 * 60 * 1000;

/**
 * Surveille l’expiration JWT : avertissement 5 min avant, redirection propre à expiration / 401.
 */
export default function SessionExpiryGuard() {
  const navigate = useNavigate();
  const [warn, setWarn] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    const onExpired = (e) => {
      if (redirected.current) return;
      redirected.current = true;
      const reason = e?.detail?.reason || 'expired';
      const msg =
        reason === 'expired'
          ? 'Votre session a expiré. Reconnectez-vous pour continuer (vos brouillons sont conservés).'
          : 'Session expirée. Veuillez vous reconnecter.';
      try {
        sessionStorage.setItem('afboxing_login_flash', msg);
      } catch {
        /* ignore */
      }
      clearSession();
      navigate('/admin/login', { replace: true, state: { flash: msg } });
    };

    window.addEventListener('afboxing:auth-expired', onExpired);
    return () => window.removeEventListener('afboxing:auth-expired', onExpired);
  }, [navigate]);

  useEffect(() => {
    if (!getToken()) return undefined;

    const tick = () => {
      const exp = getTokenExpiresAt();
      if (!exp) return;
      const left = exp - Date.now();
      if (left <= 0) {
        window.dispatchEvent(
          new CustomEvent('afboxing:auth-expired', { detail: { reason: 'expired' } })
        );
        return;
      }
      setWarn(left <= WARN_MS);
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!warn) return null;

  return (
    <div className="session-expiry-banner" role="status">
      Votre session expire bientôt. Enregistrez votre travail, puis reconnectez-vous si besoin.
    </div>
  );
}
