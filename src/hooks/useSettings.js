import { useState, useEffect } from 'react';
import { settingsApi } from '../services/apiService';

const CACHE_KEY = 'afboxing_settings_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (typeof t !== 'number' || !data) return null;
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const writeCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* ignore */
  }
};

const defaultSettings = {
  contact: {
    address: '2 rue Gabriel Morain, 86000 Poitiers',
    phone: '06 37 23 26 98',
    email: 'afboxingclub86@gmail.com'
  },
  social: {
    facebook: 'https://www.facebook.com/afboxingclub86',
    instagram: 'https://www.instagram.com/afboxingclub86'
  },
  site: {
    name: 'AF Boxing Club 86',
    tagline: 'Boxer ensemble pour mieux vivre ensemble'
  }
};

export const useSettings = () => {
  const cached = readCache();
  const [settings, setSettings] = useState(() => cached || defaultSettings);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.list();

        const loaded = {
          contact: {
            address: data.contact?.['contact.address'] || defaultSettings.contact.address,
            phone: data.contact?.['contact.phone'] || defaultSettings.contact.phone,
            email: data.contact?.['contact.email'] || defaultSettings.contact.email
          },
          social: {
            facebook: data.social?.['social.facebook'] || defaultSettings.social.facebook,
            instagram: data.social?.['social.instagram'] || defaultSettings.social.instagram
          },
          site: {
            name: data.site?.['site.name'] || defaultSettings.site.name,
            tagline: data.site?.['site.tagline'] || defaultSettings.site.tagline
          }
        };

        setSettings(loaded);
        writeCache(loaded);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useSettings] API indisponible, valeurs par défaut.', err);
        }
        if (!readCache()) {
          setSettings(defaultSettings);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
};

