import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faTrash, faPen, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { authApi, activitiesApi, pricingApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { preparePricingPayload } from '../../utils/adminAutoFill';
import { PERIOD_LABELS, NAV_ITEMS } from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import ConfirmDialog from './ConfirmDialog';
import DataTable from '../ui/DataTable';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea, SelectField, CheckboxField } from '../ui/FormField';
import HelpTip from './guided/HelpTip';
import './ManagePricing.scss';

const emptyForm = () => ({
  price_key: '',
  label: '',
  amount: '',
  period: 'an',
  note: '',
  category: 'boxing',
  enabled: true,
  activityId: '',
});

const PERIOD_OPTIONS = Object.entries(PERIOD_LABELS).map(([value, label]) => ({ value, label }));

const ManagePricing = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useAdminNotify('pricing');
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const enabledActivities = useMemo(
    () => (activities || []).filter((a) => a.enabled !== false),
    [activities]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, acts] = await Promise.all([pricingApi.adminList(), activitiesApi.list()]);
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
    if (ready) load();
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
      activityId: r.activityId || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pricingColumns = useMemo(
    () => [
      { key: 'label', label: 'Nom du tarif' },
      {
        key: 'amount',
        label: 'Montant',
        render: (r) => `${typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount} €`,
      },
      {
        key: 'period',
        label: 'Période',
        render: (r) => PERIOD_LABELS[r.period] || r.period,
      },
      {
        key: 'activityId',
        label: 'Activité liée',
        render: (r) => r.activityTitle || '—',
      },
      {
        key: 'enabled',
        label: 'Visible',
        render: (r) => (r.enabled !== false ? 'Oui' : 'Non'),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="pricing-table__actions">
            <button type="button" className="btn-edit" onClick={() => startEdit(r)}>
              Modifier
            </button>
            <button type="button" className="btn-delete" onClick={() => setDeleteRow(r)}>
              Supprimer
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(String(form.amount).replace(',', '.'));
    if (Number.isNaN(amountNum) || amountNum < 0) {
      notifyError('Indiquez un montant valide en euros.');
      return;
    }
    const existingKeys = rows.map((r) => r.priceKey);
    const prepared = preparePricingPayload(
      { ...form, amount: amountNum },
      activities,
      existingKeys,
      !!editingKey
    );
    try {
      if (editingKey) {
        await pricingApi.updateOne(editingKey, {
          label: prepared.label,
          amount: amountNum,
          period: prepared.period,
          note: prepared.note.trim() || null,
          category: prepared.category,
          enabled: prepared.enabled ? 1 : 0,
          activityId: prepared.activityId || null,
        });
        notifySuccess('Tarif enregistré.');
      } else {
        await pricingApi.create({
          price_key: prepared.price_key,
          label: prepared.label,
          amount: amountNum,
          period: prepared.period,
          note: prepared.note.trim() || null,
          category: prepared.category,
          enabled: prepared.enabled ? 1 : 0,
          activity_id: prepared.activityId || null,
        });
        notifySuccess('Tarif ajouté.');
      }
      resetForm();
      load();
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer ce tarif.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow?.priceKey) return;
    try {
      await pricingApi.remove(deleteRow.priceKey);
      notifySuccess('Tarif supprimé.');
      if (editingKey === deleteRow.priceKey) resetForm();
      load();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce tarif.');
    } finally {
      setDeleteRow(null);
    }
  };

  if (!ready) return null;

  return (
    <div className="manage-pricing">
      <PageHeader
        title="Tarifs"
        subtitle="Les tarifs s'affichent sur la page Tarifs du site et sur les fiches activités."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.pricing)}
      />

      <HelpTip text="Vous n'avez pas besoin de référence technique : donnez simplement un nom au tarif et le montant." />

      <section className="pricing-form-card modern-card">
        <h3>{editingKey ? `Modifier : ${form.label}` : 'Ajouter un tarif'}</h3>
        <form onSubmit={handleSubmit} className="pricing-form">
          <TextInput
            label="Nom du tarif"
            name="mp-label"
            value={form.label}
            onChange={(ev) => setForm((f) => ({ ...f, label: ev.target.value }))}
            required
            example="Licence loisir adulte"
          />
          <div className="form-row form-row--inline">
            <TextInput
              label="Montant (€)"
              name="mp-amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
              required
            />
            <SelectField
              label="Période"
              name="mp-period"
              value={form.period}
              onChange={(ev) => setForm((f) => ({ ...f, period: ev.target.value }))}
              options={PERIOD_OPTIONS}
            />
          </div>
          <SelectField
            label="Activité liée"
            name="mp-act"
            value={form.activityId}
            onChange={(ev) => setForm((f) => ({ ...f, activityId: ev.target.value }))}
            optionalLabel="(facultatif)"
            options={[
              { value: '', label: '— Aucune activité —' },
              ...enabledActivities.map((a) => ({ value: a.id, label: a.title || a.id })),
            ]}
            help="Lie ce tarif à une activité pour l'afficher sur sa fiche."
          />
          <TextArea
            label="Note complémentaire"
            name="mp-note"
            rows={2}
            value={form.note}
            onChange={(ev) => setForm((f) => ({ ...f, note: ev.target.value }))}
            optionalLabel="(facultatif)"
            help="Texte affiché sous le montant sur le site."
          />
          <CheckboxField
            label="Visible sur le site"
            name="pricing-enabled"
            checked={form.enabled}
            onChange={(ev) => setForm((f) => ({ ...f, enabled: ev.target.checked }))}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <FontAwesomeIcon icon={editingKey ? faPen : faPlus} aria-hidden />
              {editingKey ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingKey ? (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                <FontAwesomeIcon icon={faTimes} aria-hidden /> Annuler
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="pricing-table-wrap modern-card" aria-busy={loading}>
        {loading ? <p className="admin-state--loading"><span className="admin-state__spinner" aria-hidden />Chargement…</p> : null}
        {error && !loading ? <div className="admin-state--error" role="alert">{error}</div> : null}
        {!loading && !error ? (
          <DataTable columns={pricingColumns} data={rows} rowKey="priceKey" emptyMessage="Aucun tarif pour le moment." className="pricing-table" />
        ) : null}
      </section>

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce tarif ?"
        itemLabel={deleteRow?.label}
        consequences={[
          'Le tarif disparaîtra de la page Tarifs.',
          'Les activités liées n\'afficheront plus ce montant.',
        ]}
        type="danger"
        danger
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ManagePricing;
