import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/apiService';

/**
 * Vérifie que l’utilisateur connecté a le rôle admin (API).
 * Redirige vers le dashboard ou le login sinon.
 * @returns {boolean} true lorsque la vérification est OK et le rendu peut continuer
 */
export function useRequireAdmin() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.getMe();
        if (me?.user?.role !== 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
        if (!cancelled) setAllowed(true);
      } catch {
        navigate('/admin/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return allowed;
}
