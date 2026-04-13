import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faTrash, faPen, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi, usersApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import './ManageUsers.scss';

const emptyForm = {
  username: '',
  password: '',
  role: 'editor'
};

const ManageUsers = () => {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myId, setMyId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 403) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setError(err.message || 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const gate = async () => {
      try {
        const me = await authApi.getMe();
        if (me?.user?.role !== 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
        setMyId(me.user.id);
      } catch {
        navigate('/admin/login', { replace: true });
      }
    };
    gate();
  }, [navigate]);

  useEffect(() => {
    if (myId == null) return;
    loadUsers();
  }, [myId, loadUsers]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const payload = {
          username: form.username.trim(),
          role: form.role
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await usersApi.update(editingId, payload);
        success('Utilisateur mis à jour.');
      } else {
        await usersApi.create({
          username: form.username.trim(),
          password: form.password,
          role: form.role
        });
        success('Utilisateur créé.');
      }
      resetForm();
      loadUsers();
    } catch (err) {
      notifyError(err.message || 'Enregistrement impossible.');
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username,
      password: '',
      role: u.role || 'editor'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.remove(deleteTarget);
      success('Utilisateur supprimé.');
      loadUsers();
    } catch (err) {
      notifyError(err.message || 'Suppression impossible.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="manage-users">
      <div className="page-header">
        <h2>
          <FontAwesomeIcon icon={faUserShield} aria-hidden />
          <span>Utilisateurs staff</span>
        </h2>
        <p className="page-header__hint">
          Comptes administrateur ou éditeur. Le dernier administrateur ne peut pas être supprimé ni rétrogradé.
        </p>
      </div>

      <motion.section
        className="user-form-card modern-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>{editingId ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}</h3>
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <label htmlFor="mu-username">Nom d’utilisateur</label>
            <input
              id="mu-username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(ev) => setForm((f) => ({ ...f, username: ev.target.value }))}
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          <div className="form-row">
            <label htmlFor="mu-password">
              {editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </label>
            <input
              id="mu-password"
              type="password"
              autoComplete={editingId ? 'new-password' : 'new-password'}
              value={form.password}
              onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
              required={!editingId}
              minLength={editingId ? 0 : 8}
            />
          </div>
          <div className="form-row">
            <label htmlFor="mu-role">Rôle</label>
            <select
              id="mu-role"
              value={form.role}
              onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
            >
              <option value="admin">Administrateur</option>
              <option value="editor">Éditeur</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <FontAwesomeIcon icon={editingId ? faPen : faPlus} aria-hidden />
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                <FontAwesomeIcon icon={faTimes} aria-hidden />
                Annuler
              </button>
            )}
          </div>
        </form>
      </motion.section>

      <section className="users-table-wrap modern-card" aria-busy={loading}>
        {loading && <p className="muted">Chargement…</p>}
        {error && !loading && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <table className="users-table">
            <caption className="sr-only">Liste des comptes staff</caption>
            <thead>
              <tr>
                <th scope="col">Utilisateur</th>
                <th scope="col">Rôle</th>
                <th scope="col">Créé le</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>
                    <span className={`role-pill role-pill--${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="actions">
                    <button type="button" className="btn-icon" onClick={() => startEdit(u)} aria-label={`Modifier ${u.username}`}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      disabled={Number(u.id) === Number(myId)}
                      title={Number(u.id) === Number(myId) ? 'Vous ne pouvez pas supprimer votre compte ici' : 'Supprimer'}
                      onClick={() => {
                        setDeleteTarget(u.id);
                        setShowDeleteConfirm(true);
                      }}
                      aria-label={`Supprimer ${u.username}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Supprimer cet utilisateur ?"
        message="Cette action est définitive."
        type="danger"
        danger
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ManageUsers;
