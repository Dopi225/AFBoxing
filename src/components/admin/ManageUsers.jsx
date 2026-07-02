import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi, usersApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { ROLES, NAV_ITEMS } from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import ConfirmDialog from './ConfirmDialog';
import DataTable from '../ui/DataTable';
import PageHeader from '../ui/PageHeader';
import { LoadingState } from '../PageStates';
import { TextInput, SelectField } from '../ui/FormField';
import './ManageUsers.scss';

const emptyForm = {
  username: '',
  password: '',
  role: 'editor'
};

const ManageUsers = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useAdminNotify('users');
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
        notifySuccess('Compte enregistré.');
      } else {
        await usersApi.create({
          username: form.username.trim(),
          password: form.password,
          role: form.role
        });
        notifySuccess('Compte créé.');
      }
      resetForm();
      loadUsers();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer ce compte.');
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

  const userColumns = useMemo(() => [
    { key: 'username', label: 'Identifiant' },
    {
      key: 'role',
      label: 'Rôle',
      render: (u) => <span className={`role-pill role-pill--${u.role}`}>{ROLES[u.role]?.label || u.role}</span>
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (u) => (u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="actions">
          <button type="button" className="btn-edit" onClick={() => startEdit(u)}>Modifier</button>
          <button
            type="button"
            className="btn-delete"
            disabled={Number(u.id) === Number(myId)}
            title={Number(u.id) === Number(myId) ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
            onClick={() => { setDeleteTarget(u); setShowDeleteConfirm(true); }}
          >
            Supprimer
          </button>
        </div>
      )
    }
  ], [myId]);

  const confirmDeleteUser = async () => {
    if (!deleteTarget?.id) return;
    try {
      await usersApi.remove(deleteTarget.id);
      notifySuccess('Compte supprimé.');
      loadUsers();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce compte.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="manage-users">
      <PageHeader
        title="Comptes d'accès"
        subtitle="Créez les comptes des personnes qui gèrent le site. Chaque compte a un identifiant et un mot de passe."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.users)}
      />

      <motion.section
        className="user-form-card modern-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>{editingId ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}</h3>
        <form onSubmit={handleSubmit} className="user-form">
          <TextInput
            label="Identifiant"
            name="mu-username"
            autoComplete="username"
            value={form.username}
            onChange={(ev) => setForm((f) => ({ ...f, username: ev.target.value }))}
            required
            minLength={2}
            maxLength={50}
          />
          <TextInput
            label={editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            name="mu-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
            required={!editingId}
            minLength={editingId ? 0 : 8}
          />
          <SelectField
            label="Rôle"
            name="mu-role"
            value={form.role}
            onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
            options={[
              { value: 'admin', label: 'Responsable (accès complet)' },
              { value: 'editor', label: 'Éditeur de contenu' },
            ]}
            help={`Responsable : ${ROLES.admin.help}. Éditeur : ${ROLES.editor.help}.`}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
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
        {loading && <LoadingState label="Chargement…" />}
        {error && !loading && <div className="admin-state--error" role="alert">{error}</div>}
        {!loading && !error && users.length === 0 && (
          <div className="empty-state">Aucun utilisateur enregistré.</div>
        )}
        {!loading && !error && users.length > 0 && (
          <DataTable
            columns={userColumns}
            data={users}
            rowKey="id"
            className="users-table"
          />
        )}
      </section>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Supprimer ce compte ?"
        itemLabel={deleteTarget?.username}
        consequences={['La personne ne pourra plus se connecter.', 'Cette action ne peut pas être annulée.']}
        type="danger"
        danger
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ManageUsers;
