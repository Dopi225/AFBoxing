const TECHNICAL_PATTERNS = [
  /vite_/i,
  /jwt/i,
  /token/i,
  /json attendu/i,
  /\/api\//i,
  /unexpected token/i,
];

function isNetworkFailure(err, raw) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (err?.name === 'TypeError' && /fetch|network|load failed/i.test(raw)) return true;
  return /failed to fetch|networkerror|load failed|network request failed|err_internet|err_connection/i.test(
    raw
  );
}

/**
 * Convertit une erreur API/réseau en message compréhensible pour le grand public.
 * Ne modifie pas l'erreur source — usage à l'affichage uniquement.
 */
export function toUserMessage(err, fallback = 'Une erreur est survenue. Réessayez dans un instant.') {
  if (!err) return fallback;

  const status = err.status ?? err.response?.status;
  const raw = typeof err === 'string' ? err : err.message || '';

  if (isNetworkFailure(err, raw)) {
    return 'Connexion interrompue. Vérifiez votre réseau puis réessayez — vos saisies sont conservées.';
  }

  if (status === 401) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  if (status === 403) {
    return "Vous n'avez pas accès à cette section.";
  }
  if (status === 404) {
    return 'Contenu introuvable.';
  }
  if (status === 429) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (status >= 500) {
    return 'Le service est momentanément indisponible. Réessayez plus tard.';
  }

  const isTechnical =
    TECHNICAL_PATTERNS.some((p) => p.test(raw)) ||
    raw.includes('VITE_') ||
    raw.includes('JWT_SECRET');

  if (isTechnical || !raw.trim()) {
    return fallback;
  }

  return raw;
}

export function logTechnicalError(context, err) {
  if (import.meta.env?.DEV && err) {
    console.error(`[${context}]`, err);
  }
}
