import React, { useState, useEffect } from 'react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faEnvelope,
  faPhoneAlt,
  faMapMarkerAlt,
  faGlobe,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faInstagram as faInstagramBrand } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';
import { useNotifications } from './NotificationSystem';
import { settingsApi } from '../../services/apiService';
import { logActivity } from '../../utils/activityLogger';
import './ManageSettings.scss';

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

const ManageSettings = () => {
  const adminOk = useRequireAdmin();
  const { success, error: notifyError } = useNotifications();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!adminOk) return;
    loadSettings();
  }, [adminOk]);

  const loadSettings = async () => {
    setLoading(true);
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
      notifyError('Erreur lors du chargement des paramètres');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        'contact.address': settings.contact.address,
        'contact.phone': settings.contact.phone,
        'contact.email': settings.contact.email,
        'social.facebook': settings.social.facebook,
        'social.instagram': settings.social.instagram,
        'site.name': settings.site.name,
        'site.tagline': settings.site.tagline
      };
      
      await settingsApi.update(settingsToSave);
      logActivity('update', 'settings', 'Paramètres du site mis à jour');
      success('✅ Paramètres sauvegardés avec succès !');
      setHasChanges(false);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la sauvegarde des paramètres';
      notifyError(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  if (!adminOk) {
    return (
      <div className="manage-settings">
        <div className="empty-state">
          <p>Vérification des droits…</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="manage-settings">
        <div className="empty-state">
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-settings">
      <div className="page-header">
        <div>
          <h2>Paramètres du site</h2>
          <p className="page-subtitle">Gérez les informations de contact, réseaux sociaux et configuration générale</p>
        </div>
        <div className="header-actions">
          {hasChanges && (
            <span className="unsaved-indicator">Modifications non sauvegardées</span>
          )}
          <button
            className="btn-secondary"
            onClick={resetToDefaults}
            disabled={saving}
          >
            Réinitialiser
          </button>
          <button
            className="btn-primary"
            onClick={saveSettings}
            disabled={saving || !hasChanges}
          >
            <FontAwesomeIcon icon={faSave} />
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les paramètres'}
          </button>
        </div>
      </div>

      <div className="settings-sections">
        {/* Informations de contact */}
        <motion.section
          className="settings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <h3>Informations de contact</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                Adresse
              </label>
              <input
                type="text"
                value={settings.contact.address}
                onChange={(e) => updateSetting('contact', 'address', e.target.value)}
                placeholder="Adresse complète"
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faPhoneAlt} />
                Téléphone
              </label>
              <input
                type="tel"
                value={settings.contact.phone}
                onChange={(e) => updateSetting('contact', 'phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faEnvelope} />
                Email
              </label>
              <input
                type="email"
                value={settings.contact.email}
                onChange={(e) => updateSetting('contact', 'email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </motion.section>

        {/* Réseaux sociaux */}
        <motion.section
          className="settings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faGlobe} />
            <h3>Réseaux sociaux</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faFacebookF} />
                Facebook
              </label>
              <input
                type="url"
                value={settings.social.facebook}
                onChange={(e) => updateSetting('social', 'facebook', e.target.value)}
                placeholder="https://www.facebook.com/..."
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faInstagramBrand} />
                Instagram
              </label>
              <input
                type="url"
                value={settings.social.instagram}
                onChange={(e) => updateSetting('social', 'instagram', e.target.value)}
                placeholder="https://www.instagram.com/..."
              />
            </div>
          </div>
        </motion.section>

        {/* Informations générales */}
        <motion.section
          className="settings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faInfoCircle} />
            <h3>Informations générales</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Nom du site</label>
              <input
                type="text"
                value={settings.site.name}
                onChange={(e) => updateSetting('site', 'name', e.target.value)}
                placeholder="Nom du club"
              />
            </div>
            <div className="form-group">
              <label>Slogan / Tagline</label>
              <input
                type="text"
                value={settings.site.tagline}
                onChange={(e) => updateSetting('site', 'tagline', e.target.value)}
                placeholder="Slogan du club"
              />
            </div>
          </div>
        </motion.section>

        {/* Note importante */}
        <motion.div
          className="settings-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
          <div>
            <strong>Note importante :</strong>
            <p>
              Les modifications seront visibles sur le site public après sauvegarde.
              Pour une mise à jour immédiate, il peut être nécessaire de recharger la page.
            </p>
            <p className="note-success" style={{ color: '#28a745', marginTop: '0.5rem' }}>
              ✅ Les paramètres sont maintenant synchronisés avec la base de données !
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ManageSettings;

