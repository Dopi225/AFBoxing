import React, { useState, useEffect, useRef } from 'react';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useDirtyBeforeUnload } from '../../hooks/useDirtyBeforeUnload';
import { validateEmail, validateUrl } from '../../utils/formValidation';
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
import { useAdminNotify } from '../../hooks/useAdminNotify';
import ConfirmDialog from './ConfirmDialog';
import { settingsApi } from '../../services/apiService';
import { logActivity } from '../../utils/activityLogger';
import { TextInput } from '../ui/FormField';
import { LoadingState } from '../PageStates';
import PageHeader from '../ui/PageHeader';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageSettings.scss';

const DRAFT_KEY = 'afboxing_draft_settings';

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
  const { notifySuccess, notifyError, notifyInfo } = useAdminNotify('settings');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const savedBaselineRef = useRef(JSON.stringify(defaultSettings));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    facebook: '',
    instagram: '',
  });

  const hasChanges = JSON.stringify(settings) !== savedBaselineRef.current;
  useDirtyBeforeUnload(hasChanges);

  const { clearDraft } = useFormDraft(DRAFT_KEY, settings, {
    enabled: !loading && hasChanges,
  });

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
      savedBaselineRef.current = JSON.stringify(loaded);
      try {
        const draftRaw = localStorage.getItem(DRAFT_KEY);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft && JSON.stringify(draft) !== savedBaselineRef.current) {
            setSettings(draft);
            notifyInfo('Un brouillon des paramètres a été restauré. Enregistrez pour publier sur le site.');
          }
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (err) {
      notifyError(err, 'Impossible de charger les informations du club.');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    const errors = {
      email: validateEmail(settings.contact.email),
      facebook: validateUrl(settings.social.facebook),
      instagram: validateUrl(settings.social.instagram),
    };
    setFieldErrors(errors);
    if (errors.email || errors.facebook || errors.instagram) {
      notifyError(null, 'Corrigez les champs en erreur avant d\'enregistrer.');
      return;
    }

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
      notifySuccess('Informations du club enregistrées.');
      savedBaselineRef.current = JSON.stringify(settings);
      clearDraft();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer. Vérifiez les champs et réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const validateField = (field, value) => {
    let err = '';
    if (field === 'email') err = validateEmail(value);
    else if (field === 'facebook' || field === 'instagram') err = validateUrl(value);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    if (['email', 'facebook', 'instagram'].includes(key) && fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const resetToDefaults = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setSettings(defaultSettings);
    setFieldErrors({ email: '', facebook: '', instagram: '' });
  };

  if (!adminOk) {
    return (
      <div className="manage-settings">
        <LoadingState label="Vérification des droits…" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="manage-settings">
        <LoadingState label="Chargement des paramètres…" />
      </div>
    );
  }

  return (
    <div className="manage-settings">
      <PageHeader
        title="Informations du club"
        subtitle="Ces informations apparaissent sur le site public (contact, réseaux sociaux, nom du club)."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.settings)}
        actions={
          <>
            {hasChanges && (
              <span className="unsaved-indicator">Modifications non enregistrées</span>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetToDefaults}
              disabled={saving}
            >
              Réinitialiser
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={saving || !hasChanges}
            >
              <FontAwesomeIcon icon={faSave} />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      />

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
            <TextInput
              label="Adresse"
              name="contact-address"
              value={settings.contact.address}
              onChange={(e) => updateSetting('contact', 'address', e.target.value)}
              placeholder="Adresse complète"
            />
            <TextInput
              label="Téléphone"
              name="contact-phone"
              type="tel"
              value={settings.contact.phone}
              onChange={(e) => updateSetting('contact', 'phone', e.target.value)}
              placeholder="06 12 34 56 78"
            />
            <TextInput
              label="Email"
              name="contact-email"
              type="email"
              value={settings.contact.email}
              onChange={(e) => updateSetting('contact', 'email', e.target.value)}
              onBlur={(e) => validateField('email', e.target.value)}
              error={fieldErrors.email}
              placeholder="contact@example.com"
            />
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
            <TextInput
              label="Facebook"
              name="social-facebook"
              type="url"
              value={settings.social.facebook}
              onChange={(e) => updateSetting('social', 'facebook', e.target.value)}
              onBlur={(e) => validateField('facebook', e.target.value)}
              error={fieldErrors.facebook}
              placeholder="https://www.facebook.com/..."
            />
            <TextInput
              label="Instagram"
              name="social-instagram"
              type="url"
              value={settings.social.instagram}
              onChange={(e) => updateSetting('social', 'instagram', e.target.value)}
              onBlur={(e) => validateField('instagram', e.target.value)}
              error={fieldErrors.instagram}
              placeholder="https://www.instagram.com/..."
            />
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
            <h3>Présentation du club</h3>
          </div>
          <div className="settings-form">
            <TextInput
              label="Nom du site"
              name="site-name"
              value={settings.site.name}
              onChange={(e) => updateSetting('site', 'name', e.target.value)}
              placeholder="Nom du club"
            />
            <TextInput
              label="Slogan du club"
              name="site-tagline"
              value={settings.site.tagline}
              onChange={(e) => updateSetting('site', 'tagline', e.target.value)}
              placeholder="Boxer ensemble pour mieux vivre ensemble"
              example="Une courte phrase qui résume l'esprit du club"
            />
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
            <strong>À savoir :</strong>
            <p>
              Après enregistrement, les visiteurs verront les nouvelles informations sur le site.
            </p>
          </div>
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Réinitialiser les informations ?"
        consequences={[
          'Tous les champs reprendront les valeurs par défaut du club.',
          'Vous devrez cliquer sur Enregistrer pour appliquer sur le site.',
        ]}
        confirmText="Réinitialiser"
        danger
      />
    </div>
  );
};

export default ManageSettings;

