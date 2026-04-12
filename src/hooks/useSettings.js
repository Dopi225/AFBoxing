import { useState, useEffect } from 'react';
import { settingsApi } from '../services/apiService';

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
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.list();
        
        // Convertir les données de l'API en format attendu
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
      } catch (err) {
        console.error('Error loading settings:', err);
        // En cas d'erreur, utiliser les valeurs par défaut
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
};

