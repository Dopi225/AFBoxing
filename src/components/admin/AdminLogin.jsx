import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi } from '../../services/apiService';
import { toUserMessage, logTechnicalError } from '../../utils/userFacingError';
import ThemeToggle from '../ThemeToggle';
import { TextInput } from '../ui/FormField';
import HelpTip from './guided/HelpTip';
import './AdminLogin.scss';

const FLASH_STORAGE_KEY = 'afboxing_login_flash';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromState = location.state?.flash;
    let fromStorage = '';
    try {
      fromStorage = sessionStorage.getItem(FLASH_STORAGE_KEY) || '';
    } catch {
      /* ignore */
    }
    const msg = fromState || fromStorage;
    if (msg) {
      setFlash(msg);
      try {
        sessionStorage.removeItem(FLASH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (fromState) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(username, password);
      if (!data?.token) {
        logTechnicalError('AdminLogin', new Error('Token manquant après login'));
        throw new Error('Connexion impossible');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      if (err.status === 429) {
        setError('Trop de tentatives. Patientez quelques minutes avant de réessayer.');
      } else {
        setError(toUserMessage(err, 'Identifiant ou mot de passe incorrect. Vérifiez vos informations et réessayez.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__theme">
        <ThemeToggle compact />
      </div>
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <div className="login-icon">
            <FontAwesomeIcon icon={faShield} aria-hidden />
          </div>
          <h1>Gestion AF Boxing</h1>
          <p>Connectez-vous pour gérer le site du club</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {flash ? (
            <div className="flash-message" role="status">
              {flash}
            </div>
          ) : null}

          {error ? (
            <div className="error-message" role="alert">
              {error}
            </div>
          ) : null}

          <TextInput
            label="Identifiant"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            help="L'identifiant vous a été communiqué par le responsable du club."
          />

          <TextInput
            label="Mot de passe"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <HelpTip text="En cas d'oubli de mot de passe, contactez le responsable informatique du club." />
      </motion.div>
    </div>
  );
};

export default AdminLogin;
