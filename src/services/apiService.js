// Service centralisé pour communiquer avec l'API PHP

// Base API :
// - en prod, on peut fournir VITE_API_BASE_URL (ex: https://domaine.tld)
// - sinon, on se base sur BASE_URL de Vite pour supporter les déploiements en sous-dossier
//   (ex: http://localhost/AF/AFBoxing -> appels vers /AF/AFBoxing/api/...)
const DEFAULT_BASE_URL = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  .toString()
  .replace(/\/$/, '');
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const TOKEN_STORAGE_KEY = 'afboxing_token';

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

const setToken = (token) => {
    // On ne stocke jamais des valeurs "vides" : on supprime la clé.
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, String(token));
};
const removeToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
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

  if (!response.ok) {
    // Gestion spécifique des codes d'erreur
    let message = data?.error || data?.message || 'Une erreur est survenue';
    
    if (response.status === 401) {
      // Déconnexion automatique en cas d'erreur 401
      removeToken();
      message = 'Session expirée. Veuillez vous reconnecter.';
    } else if (response.status === 429) {
      // Rate limiting
      message = data?.error || 'Trop de tentatives. Veuillez réessayer dans quelques instants.';
    } else if (response.status === 422) {
      // Erreurs de validation
      if (data?.errors) {
        const errorMessages = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n');
        message = errorMessages;
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
      setToken(data.token);
    }

    return data;
  },

  logout: () => {
    removeToken();
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
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/news`);
    return handleResponse(res);
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
  }
};

export const palmaresApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/palmares`);
    return handleResponse(res);
  },
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
  }
};

export const scheduleApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/schedule`);
    return handleResponse(res);
  },
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
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/gallery`);
    return handleResponse(res);
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
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/contacts`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
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
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      headers: buildHeaders()
    });
    return handleResponse(res);
  },
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
  }
};

export const settingsApi = {
  list: async () => {
    // Les paramètres sont publics, pas besoin d'authentification
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      headers: buildHeaders(false)
    });
    return handleResponse(res);
  },
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

export const pricingApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/pricing`);
    return handleResponse(res);
  },
  get: async (key) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/${key}`);
    return handleResponse(res);
  },
  update: async (pricings) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ pricings })
    });
    return handleResponse(res);
  },
  updateOne: async (key, data) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/${key}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  remove: async (key) => {
    const res = await fetch(`${API_BASE_URL}/api/pricing/${key}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return handleResponse(res);
  }
};

 

