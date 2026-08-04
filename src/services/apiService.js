// Service centralisé pour communiquer avec l'API PHP

// Base API :
// - en prod, utilise VITE_API_BASE_URL (ex: https://domaine.tld)
// - en dev, on évite toute URL figée et on se base sur le host courant + BASE_URL
//   (ex: http://localhost/AF/AFBoxing -> appels vers /AF/AFBoxing/api/...)
const DEFAULT_BASE_URL = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  .toString()
  .replace(/\/$/, '');
const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const API_BASE_URL = (import.meta.env.PROD && envApiBaseUrl ? envApiBaseUrl : DEFAULT_BASE_URL).replace(/\/$/, '');

const TOKEN_STORAGE_KEY = 'afboxing_token';
const TOKEN_EXPIRES_KEY = 'afboxing_token_expires_at';

const getToken = () => {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  const token = String(raw).trim();
  // Cas fréquents quand on stocke accidentellement null/undefined en string
  if (!token || token === 'null' || token === 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  return token;
};

const setToken = (token, expiresAt = null) => {
    // On ne stocke jamais des valeurs "vides" : on supprime la clé.
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_KEY);
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, String(token));
    if (expiresAt != null) {
      const ms = typeof expiresAt === 'number'
        ? (expiresAt < 1e12 ? expiresAt * 1000 : expiresAt)
        : Date.parse(expiresAt);
      if (!Number.isNaN(ms)) {
        localStorage.setItem(TOKEN_EXPIRES_KEY, String(ms));
      }
    }
};
const removeToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
};

export const getTokenExpiresAt = () => {
  const raw = localStorage.getItem(TOKEN_EXPIRES_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export const clearSession = () => {
  removeToken();
};

export { getToken };

const emitAuthExpired = (reason = 'unauthorized') => {
  try {
    window.dispatchEvent(new CustomEvent('afboxing:auth-expired', { detail: { reason } }));
  } catch {
    /* ignore */
  }
};

const buildHeaders = (isJson = true, withAuth = true) => {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (withAuth) {
    const token = getToken();
    // IMPORTANT: ne jamais envoyer "Bearer null" / "Bearer undefined"
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // pas de corps JSON
  }

  // 207 Multi-Status : succès partiel (ex. ancien bulk planning) — traité comme erreur si errors présents
  const isPartialFailure =
    response.status === 207 && data && typeof data === 'object' && data.errors;

  if (!response.ok || isPartialFailure) {
    // Gestion spécifique des codes d'erreur (chaîne legacy ou objet { code, message })
    let message = 'Une erreur est survenue';
    if (data?.error != null) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (typeof data.error === 'object' && typeof data.error.message === 'string') {
        message = data.error.message;
      }
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }
    
    if (response.status === 401) {
      // Déconnexion automatique en cas d'erreur 401
      removeToken();
      message = 'Session expirée. Veuillez vous reconnecter.';
      emitAuthExpired('unauthorized');
    } else if (response.status === 429) {
      if (message === 'Une erreur est survenue') {
        message = 'Trop de tentatives. Veuillez réessayer dans quelques instants.';
      }
    } else if (response.status === 422 || response.status === 207) {
      // Erreurs de validation (ou multi-status partiel)
      if (data?.errors) {
        const errorMessages = Object.entries(data.errors)
          .map(([field, msg]) => {
            if (msg && typeof msg === 'object') {
              return `${field}: ${Object.values(msg).join(', ')}`;
            }
            return `${field}: ${msg}`;
          })
          .join('\n');
        message = errorMessages || message;
      }
    } else if (response.status >= 500) {
      message = 'Erreur serveur. Veuillez réessayer plus tard.';
    }
    
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  // Tous nos endpoints renvoient du JSON (sauf 204). Si on reçoit autre chose (HTML, etc),
  // on échoue explicitement au lieu de "réussir" avec {} (sinon login sans token).
  if (data === null && response.status !== 204) {
    throw new Error('Réponse API invalide (JSON attendu). Vérifiez VITE_API_BASE_URL et les règles de réécriture /api/.');
  }

  // Sécurise les appels côté front : on ne renvoie jamais "null"
  // - pour les réponses sans contenu (204) on renvoie un tableau vide
  // - pour les autres cas on renvoie un objet vide
  if (data === null) {
    if (response.status === 204) {
      return [];
    }
    return {};
  }

  return data;
};

/** Cache mémoire pour listes GET fréquentes (TTL court). Désactivé si un token est présent (admin / données à jour). */
const PUBLIC_LIST_CACHE_TTL_MS = 45_000;
const publicListCache = new Map();
const publicListInflight = new Map();

/**
 * @template T
 * @param {string} cacheKey
 * @param {() => Promise<T>} producer
 * @returns {Promise<T>}
 */
function takeCachedPublicList(cacheKey, producer) {
  if (getToken()) {
    return producer();
  }
  const now = Date.now();
  const hit = publicListCache.get(cacheKey);
  if (hit && now - hit.at < PUBLIC_LIST_CACHE_TTL_MS) {
    return Promise.resolve(hit.data);
  }
  const pending = publicListInflight.get(cacheKey);
  if (pending) return pending;
  const p = producer()
    .then((data) => {
      publicListCache.set(cacheKey, { at: Date.now(), data });
      publicListInflight.delete(cacheKey);
      return data;
    })
    .catch((err) => {
      publicListInflight.delete(cacheKey);
      throw err;
    });
  publicListInflight.set(cacheKey, p);
  return p;
}

export const authApi = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: buildHeaders(true, false),
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(res) || {};

    // Évite l'erreur "can't access property 'token', r is null"
    if (data && data.token) {
      setToken(data.token, data.expires_at ?? data.expiresAt ?? null);
    }

    return data;
  },

  logout: async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: buildHeaders(true, true)
        });
      }
    } catch {
      // Réseau / serveur : on purge quand même le token local
    } finally {
      removeToken();
    }
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: buildHeaders(true, true)
    });
    return handleResponse(res);
  },

  isAuthenticated: () => {
    return getToken() !== null;
  }
};

export const newsApi = {
  /** @param {{ page?: number, per_page?: number, withMeta?: boolean }} [opts] */
  list: async (opts = {}) => {
    const page = opts.page ?? 1;
    const perPage = opts.per_page ?? (opts.withMeta ? 50 : 500);
    const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    const cacheKey = `news|${q.toString()}|m${opts.withMeta ? '1' : '0'}`;
    return takeCachedPublicList(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/news?${q}`);
      const raw = await handleResponse(res);
      if (opts.withMeta && raw && typeof raw === 'object' && Array.isArray(raw.data)) {
        return raw;
      }
      if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
        return raw.data;
      }
      return Array.isArray(raw) ? raw : [];
    });
  },
  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/news/${id}`);
    return handleResponse(res);
  },
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/news`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  update: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/api/news/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/news/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/news/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/news/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const palmaresApi = {
  list: async () =>
    takeCachedPublicList('palmares', async () => {
      const res = await fetch(`${API_BASE_URL}/api/palmares`);
      return handleResponse(res);
    }),
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/palmares`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  update: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/api/palmares/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/palmares/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/palmares/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/palmares/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const scheduleApi = {
  list: async () =>
    takeCachedPublicList('schedule', async () => {
      const res = await fetch(`${API_BASE_URL}/api/schedule`);
      return handleResponse(res);
    }),
  bulkSave: async (items) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(items)
    });
    return handleResponse(res);
  },
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  update: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/schedule/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const galleryApi = {
  /** @param {{ page?: number, per_page?: number, withMeta?: boolean }} [opts] */
  list: async (opts = {}) => {
    const page = opts.page ?? 1;
    const perPage = opts.per_page ?? (opts.withMeta ? 48 : 200);
    const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    const cacheKey = `gallery|${q.toString()}|m${opts.withMeta ? '1' : '0'}`;
    return takeCachedPublicList(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/gallery?${q}`);
      const raw = await handleResponse(res);
      if (opts.withMeta && raw && typeof raw === 'object' && Array.isArray(raw.data)) {
        return raw;
      }
      if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
        return raw.data;
      }
      return Array.isArray(raw) ? raw : [];
    });
  },
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/gallery`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  update: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/api/gallery/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/gallery/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/gallery/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/gallery/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const contactsApi = {
  submit: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: buildHeaders(true, false),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  list: async (opts = {}) => {
    const page = opts.page ?? 1;
    const perPage = opts.per_page ?? 50;
    const q = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    const res = await fetch(`${API_BASE_URL}/api/contacts?${q}`, {
      headers: buildHeaders()
    });
    const raw = await handleResponse(res);
    if (opts.withMeta && raw && typeof raw === 'object' && Array.isArray(raw.data)) {
      return raw;
    }
    if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
      return raw.data;
    }
    return Array.isArray(raw) ? raw : [];
  },
  markAsRead: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}/read`, {
      method: 'PUT',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/contacts/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  reply: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}/reply`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export const uploadApi = {
  uploadImage: async (folder, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: buildHeaders(false, true),
      body: formData
    });
    return handleResponse(res);
  }
};

export const activitiesApi = {
  list: async () =>
    takeCachedPublicList('activities', async () => {
      const res = await fetch(`${API_BASE_URL}/api/activities`, {
        headers: buildHeaders()
      });
      return handleResponse(res);
    }),
  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/activities/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/activities/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const teamMembersApi = {
  list: async () =>
    takeCachedPublicList('team-members', async () => {
      const res = await fetch(`${API_BASE_URL}/api/team-members`, {
        headers: buildHeaders()
      });
      return handleResponse(res);
    }),
  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/${id}`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async () => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/trash`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  restore: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/${id}/restore`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  move: async (id, direction) => {
    const res = await fetch(`${API_BASE_URL}/api/team-members/${id}/move`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ direction })
    });
    return handleResponse(res);
  }
};

export const settingsApi = {
  list: async () =>
    takeCachedPublicList('settings', async () => {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: buildHeaders(false)
      });
      return handleResponse(res);
    }),
  get: async (key) => {
    const res = await fetch(`${API_BASE_URL}/api/settings/${key}`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  update: async (settings) => {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ settings })
    });
    return handleResponse(res);
  },
  remove: async (key) => {
    const res = await fetch(`${API_BASE_URL}/api/settings/${key}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const activityLogApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/activity-log${query ? `?${query}` : ''}`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/activity-log`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  clear: async () => {
    const res = await fetch(`${API_BASE_URL}/api/activity-log`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  count: async () => {
    const res = await fetch(`${API_BASE_URL}/api/activity-log/count`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const usersApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  update: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const pricingApi = {
  list: async () =>
    takeCachedPublicList('pricing', async () => {
      const res = await fetch(`${API_BASE_URL}/api/pricing`);
      return handleResponse(res);
    }),
  /** Liste détaillée (admin) : une ligne par tarif + activité liée */
  adminList: async (seasonId) => {
    const q = seasonId != null ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pricing/admin-list${q}`, {
      headers: buildHeaders(true, true)
    });
    return handleResponse(res);
  },
  /** Liste plate (admin) : clés tarifs pour lier une activité à un tarif */
  catalog: async () => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/catalog`, {
      headers: buildHeaders(true, true)
    });
    return handleResponse(res);
  },
  get: async (key) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/${key}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (pricings, seasonId = null) => {
    const body = { pricings };
    if (seasonId != null) body.seasonId = seasonId;
    const res = await fetch(`${API_BASE_URL}/api/pricing`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  updateOne: async (key, data) => {
    const seasonQ = data?.seasonId != null ? `?seasonId=${encodeURIComponent(data.seasonId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pricing/${encodeURIComponent(key)}${seasonQ}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  remove: async (key, seasonId) => {
    const q = seasonId != null ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pricing/${encodeURIComponent(key)}${q}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  listTrash: async (seasonId) => {
    const q = seasonId != null ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pricing/trash${q}`, { headers: buildHeaders() });
    return handleResponse(res);
  },
  /** Restaure par id numérique (corbeille) ou par price_key + seasonId */
  restore: async (idOrKey, seasonId) => {
    const key = encodeURIComponent(String(idOrKey));
    const q = seasonId != null ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/pricing/${key}/restore${q}`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

export const seasonsApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/seasons`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/api/seasons`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/api/seasons/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  setCurrent: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/seasons/${id}/set-current`, {
      method: 'POST',
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/seasons/${id}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

