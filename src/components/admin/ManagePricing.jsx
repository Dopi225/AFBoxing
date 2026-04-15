import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faTrash, faPen, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { authApi, activitiesApi, pricingApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import './ManagePricing.scss';

const emptyForm = () => ({
  price_key: '',
  label: '',
  amount: '',
  period: 'an',
  note: '',
  category: 'boxing',
  enabled: true,
  activityId: ''
});

const ManagePricing = () => {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotifications();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [deleteKey, setDeleteKey] = useState(null);

  const enabledActivities = useMemo(
    () => (activities || []).filter((a) => a.enabled !== false),
    [activities]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, acts] = await Promise.all([
        pricingApi.adminList(),
        activitiesApi.list()
      ]);
      setRows(Array.isArray(list) ? list : []);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch (err) {
      if (err.status === 403) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setError(err.message || 'Impossible de charger les tarifs.');
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
        setReady(true);
      } catch {
        navigate('/admin/login', { replace: true });
      }
    };
    gate();
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingKey(null);
  };

  const startEdit = (r) => {
    setEditingKey(r.priceKey);
    setForm({
      price_key: r.priceKey,
      label: r.label || '',
      amount: String(r.amount ?? ''),
      period: r.period || 'an',
      note: r.note || '',
      category: r.category || 'boxing',
      enabled: r.enabled !== false,
      activityId: r.activityId || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amountNum = Number(String(form.amount).replace(',', '.'));
    if (Number.isNaN(amountNum) || amountNum < 0) {
      notifyError('Montant invalide.');
      return;
    }

    try {
      if (editingKey) {
        await pricingApi.updateOne(editingKey, {
          label: form.label.trim(),
          amount: amountNum,
          period: form.period,
          note: form.note.trim() || null,
          category: form.category,
          enabled: form.enabled ? 1 : 0,
          activityId: form.activityId || null
        });
        success('Tarif mis à jour.');
      } else {
        const pk = form.price_key.trim();
        if (!pk) {
          notifyError('La clé technique est obligatoire.');
          return;
        }
        await pricingApi.create({
          price_key: pk,
          label: form.label.trim(),
          amount: amountNum,
          period: form.period,
          note: form.note.trim() || null,
          category: form.category,
          enabled: form.enabled ? 1 : 0,
          activity_id: form.activityId || null
        });
        success('Tarif créé.');
      }
      resetForm();
      load();
    } catch (err) {
      notifyError(err.message || 'Enregistrement impossible.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteKey) return;
    try {
      await pricingApi.remove(deleteKey);
      success('Tarif supprimé.');
      if (editingKey === deleteKey) resetForm();
      load();
    } catch (err) {
      notifyError(err.message || 'Suppression impossible.');
    } finally {
      setDeleteKey(null);
    }
  };

  return (
    <div className="manage-pricing">
      <div className="page-header">
        <h2>
          <FontAwesomeIcon icon={faMoneyBillWave} aria-hidden />
          <span>Tarifs</span>
        </h2>
        <p className="page-header__hint">
          Créez ou modifiez les lignes de la grille tarifaire. Vous pouvez lier au plus une activité par tarif ; la fiche
          activité affichera ce montant lorsque la clé correspond (<code>meta.priceKey</code>).
        </p>
      </div>

      <motion.section
        className="pricing-form-card modern-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>{editingKey ? `Modifier — ${editingKey}` : 'Nouveau tarif'}</h3>
        <form onSubmit={handleSubmit} className="pricing-form">
          {!editingKey && (
            <div className="form-row">
              <label htmlFor="mp-key">Clé technique (unique)</label>
              <input
                id="mp-key"
                type="text"
                value={form.price_key}
                onChange={(ev) => setForm((f) => ({ ...f, price_key: ev.target.value }))}
                placeholder="ex. boxing.loisir"
                required
                maxLength={100}
                autoComplete="off"
              />
            </div>
          )}
          <div className="form-row">
            <label htmlFor="mp-label">Libellé</label>
            <input
              id="mp-label"
              type="text"
              value={form.label}
              onChange={(ev) => setForm((f) => ({ ...f, label: ev.target.value }))}
              required
              maxLength={255}
            />
          </div>
          <div className="form-row form-row--inline">
            <div>
              <label htmlFor="mp-amount">Montant (€)</label>
              <input
                id="mp-amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="mp-period">Période</label>
              <input
                id="mp-period"
                type="text"
                value={form.period}
                onChange={(ev) => setForm((f) => ({ ...f, period: ev.target.value }))}
                placeholder="an"
                maxLength={20}
              />
            </div>
            <div>
              <label htmlFor="mp-cat">Catégorie</label>
              <select
                id="mp-cat"
                value={form.category}
                onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))}
              >
                <option value="boxing">boxing</option>
                <option value="social">social</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="mp-note">Note (affichage public)</label>
            <textarea
              id="mp-note"
              rows={2}
              value={form.note}
              onChange={(ev) => setForm((f) => ({ ...f, note: ev.target.value }))}
            />
          </div>
          <div className="form-row">
            <label htmlFor="mp-act">Activité liée (optionnel)</label>
            <select
              id="mp-act"
              value={form.activityId}
              onChange={(ev) => setForm((f) => ({ ...f, activityId: ev.target.value }))}
            >
              <option value="">— Aucune —</option>
              {enabledActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title || a.id}
                </option>
              ))}
            </select>
            <span className="form-hint">
              Une seule ligne tarif peut être liée à une activité donnée. Les activités désactivées ne sont pas proposées.
            </span>
          </div>
          <div className="form-row form-row--checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(ev) => setForm((f) => ({ ...f, enabled: ev.target.checked }))}
              />
              Tarif visible sur le site (API publique)
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <FontAwesomeIcon icon={editingKey ? faPen : faPlus} aria-hidden />
              {editingKey ? 'Enregistrer' : 'Créer'}
            </button>
            {editingKey && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                <FontAwesomeIcon icon={faTimes} aria-hidden />
                Annuler
              </button>
            )}
          </div>
        </form>
      </motion.section>

      <section className="pricing-table-wrap modern-card" aria-busy={loading}>
        {loading && <p className="muted">Chargement…</p>}
        {error && !loading && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Clé</th>
                  <th>Libellé</th>
                  <th>Montant</th>
                  <th>Période</th>
                  <th>Cat.</th>
                  <th>Activité</th>
                  <th>Actif</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.priceKey}>
                    <td>
                      <code>{r.priceKey}</code>
                    </td>
                    <td>{r.label}</td>
                    <td>{typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount} €</td>
                    <td>{r.period}</td>
                    <td>{r.category}</td>
                    <td>{r.activityTitle || (r.activityId ? r.activityId : '—')}</td>
                    <td>{r.enabled ? 'oui' : 'non'}</td>
                    <td className="pricing-table__actions">
                      <button type="button" className="btn-icon" onClick={() => startEdit(r)} title="Modifier">
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon--danger"
                        onClick={() => setDeleteKey(r.priceKey)}
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="muted">Aucun tarif.</p>}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!deleteKey}
        onClose={() => setDeleteKey(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce tarif ?"
        message="Les activités qui utilisaient cette clé devront être mises à jour si besoin."
        type="danger"
        danger
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ManagePricing;
