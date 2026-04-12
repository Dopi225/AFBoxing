import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faShield } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi } from '../../services/apiService';
import './AdminLogin.scss';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(username, password);
      // En prod, si l'API répond 200 mais sans token (rewrite /api cassé, JWT_SECRET manquant, etc.),
      // on refuse la redirection pour éviter un dashboard "cassé" sans authentification.
      if (!data?.token) {
        throw new Error("Connexion impossible : token manquant (vérifie la route /api/auth/login et la config JWT_SECRET).");
      }
      navigate('/admin/dashboard');
    } catch (err) {
      // Gestion spécifique des erreurs de rate limiting
      if (err.status === 429) {
        setError(err.message || 'Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.');
      } else {
        setError(err.message || 'Identifiants incorrects ou erreur de connexion.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <div className="login-icon">
            <FontAwesomeIcon icon={faShield} />
          </div>
          <h1>Administration</h1>
          <p>AF Boxing Club 86</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faUser} />
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faLock} />
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>Accès réservé aux administrateurs</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

