import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faPlus,
  faTimes,
  faStar,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { authApi, activitiesApi, pricingApi, seasonsApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { validateAmount, validateRequired } from '../../utils/formValidation';
import { preparePricingPayload } from '../../utils/adminAutoFill';
import { PERIOD_LABELS, NAV_ITEMS } from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { logActivity } from '../../utils/activityLogger';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import DataTable from '../ui/DataTable';
import PageHeader from '../ui/PageHeader';
import Modal from '../ui/Modal';
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

const suggestNextSeasonLabel = (currentLabel) => {
  const m = String(currentLabel || '').match(/(\d{4})\s*[-–\/]\s*(\d{4})/);
  if (m) {
    const start = Number(m[1]) + 1;
    const end = Number(m[2]) + 1;
    return `${start}-${end}`;
  }
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
};

const defaultSeasonDates = (label) => {
  const m = String(label || '').match(/(\d{4})/);
  const startYear = m ? Number(m[1]) : new Date().getFullYear();
  return {
    startsOn: `${startYear}-09-01`,
    endsOn: `${startYear + 1}-08-31`,
  };
};

const seasonDisplayName = (season) =>
  season?.label ? `Saison ${season.label}` : 'Saison';

const ManagePricing = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useAdminNotify('pricing');
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [activities, setActivities] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingKey, setEditingKey] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [seasonForm, setSeasonForm] = useState({
    label: '',
    startsOn: '',
    endsOn: '',
    copyFromSeasonId: '',
  });
  const [seasonFieldErrors, setSeasonFieldErrors] = useState({});
  const [showSetCurrentConfirm, setShowSetCurrentConfirm] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(false);

  const enabledActivities = useMemo(
    () => (activities || []).filter((a) => a.enabled !== false),
    [activities]
  );

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) || null,
    [seasons, selectedSeasonId]
  );

  const currentSeason = useMemo(
    () => seasons.find((s) => s.isCurrent) || null,
    [seasons]
  );

  const isArchivedSeason = Boolean(selectedSeason && !selectedSeason.isCurrent);

  const loadSeasons = useCallback(async () => {
    const list = await seasonsApi.list();
    const arr = Array.isArray(list) ? list : [];
    setSeasons(arr);
    return arr;
  }, []);

  const load = useCallback(async (seasonId) => {
    const sid = seasonId ?? selectedSeasonId;
    if (sid == null) return;
    setLoading(true);
    setError('');
    try {
      const [list, acts] = await Promise.all([
        pricingApi.adminList(sid),
        activitiesApi.list(),
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
  }, [navigate, selectedSeasonId]);

  useEffect(() => {
    const gate = async () => {
      try {
        const me = await authApi.getMe();
        if (me?.user?.role !== 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
        const list = await loadSeasons();
        const current = list.find((s) => s.isCurrent) || list[0];
        if (current) {
          setSelectedSeasonId(current.id);
        }
        setReady(true);
      } catch {
        navigate('/admin/login', { replace: true });
      }
    };
    gate();
  }, [navigate, loadSeasons]);

  useEffect(() => {
    if (ready && selectedSeasonId != null) {
      load(selectedSeasonId);
    }
  }, [ready, selectedSeasonId, load]);

  const seasonScopedApi = useMemo(
    () => ({
      listTrash: () => pricingApi.listTrash(selectedSeasonId),
      restore: (id) => pricingApi.restore(id, selectedSeasonId),
    }),
    [selectedSeasonId]
  );

  const trash = useEntityTrash(seasonScopedApi, {
    onReload: () => load(selectedSeasonId),
    notifySuccess,
    notifyError,
    entityLabel: 'Tarif',
  });

  const handleAmountBlur = () => {
    setFieldErrors((prev) => ({ ...prev, amount: validateAmount(form.amount) }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingKey(null);
    setFieldErrors({});
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
        render: (r) =>
          Number(r.amount) === 0
            ? 'Gratuit'
            : `${typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount} €`,
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
    if (selectedSeasonId == null) return;
    const amountError = validateAmount(form.amount);
    if (amountError) {
      setFieldErrors((prev) => ({ ...prev, amount: amountError }));
      notifyError(amountError);
      return;
    }
    const amountNum = Number(String(form.amount).replace(',', '.'));
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
          seasonId: selectedSeasonId,
        });
        logActivity(
          'update',
          'pricing',
          `Tarif « ${prepared.label} » modifié (${seasonDisplayName(selectedSeason)})`
        );
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
          seasonId: selectedSeasonId,
        });
        logActivity(
          'create',
          'pricing',
          `Tarif « ${prepared.label} » ajouté (${seasonDisplayName(selectedSeason)})`
        );
        notifySuccess('Tarif ajouté.');
      }
      resetForm();
      load(selectedSeasonId);
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer ce tarif.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow?.priceKey || selectedSeasonId == null) return;
    try {
      await pricingApi.remove(deleteRow.priceKey, selectedSeasonId);
      logActivity(
        'delete',
        'pricing',
        `Tarif « ${deleteRow.label} » déplacé en corbeille (${seasonDisplayName(selectedSeason)})`
      );
      notifySuccess('Tarif déplacé en corbeille.');
      if (editingKey === deleteRow.priceKey) resetForm();
      load(selectedSeasonId);
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce tarif.');
    } finally {
      setDeleteRow(null);
    }
  };

  const openCreateSeason = () => {
    const base = currentSeason || selectedSeason || seasons[0];
    const label = suggestNextSeasonLabel(base?.label);
    const dates = defaultSeasonDates(label);
    setSeasonForm({
      label,
      startsOn: dates.startsOn,
      endsOn: dates.endsOn,
      copyFromSeasonId: String(base?.id || ''),
    });
    setSeasonFieldErrors({});
    setShowCreateSeason(true);
  };

  const handleCreateSeason = async () => {
    const errors = {
      label: validateRequired(seasonForm.label, 'Le libellé'),
      startsOn: validateRequired(seasonForm.startsOn, 'La date de début'),
      endsOn: validateRequired(seasonForm.endsOn, 'La date de fin'),
      copyFromSeasonId: validateRequired(seasonForm.copyFromSeasonId, 'La saison à copier'),
    };
    if (seasonForm.startsOn && seasonForm.endsOn && seasonForm.endsOn < seasonForm.startsOn) {
      errors.endsOn = 'La date de fin doit être après la date de début.';
    }
    setSeasonFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setCreatingSeason(true);
    try {
      const result = await seasonsApi.create({
        label: seasonForm.label.trim(),
        startsOn: seasonForm.startsOn,
        endsOn: seasonForm.endsOn,
        copyFromSeasonId: Number(seasonForm.copyFromSeasonId),
      });
      const created = result?.season;
      const n = result?.copiedCount ?? 0;
      logActivity(
        'create',
        'season',
        `Saison ${created?.label || seasonForm.label} créée (${n} tarif${n > 1 ? 's' : ''} copié${n > 1 ? 's' : ''})`
      );
      notifySuccess(
        `Saison ${created?.label || seasonForm.label} créée. ${n} tarif${n > 1 ? 's' : ''} copié${n > 1 ? 's' : ''}.`
      );
      setShowCreateSeason(false);
      const list = await loadSeasons();
      if (created?.id) {
        setSelectedSeasonId(created.id);
      } else {
        const newest = list[0];
        if (newest) setSelectedSeasonId(newest.id);
      }
    } catch (err) {
      notifyError(err, 'Impossible de créer la saison. Vérifiez les dates et réessayez.');
    } finally {
      setCreatingSeason(false);
    }
  };

  const confirmSetCurrent = async () => {
    if (!selectedSeason) return;
    setSettingCurrent(true);
    try {
      const prevLabel = currentSeason?.label || 'précédente';
      await seasonsApi.setCurrent(selectedSeason.id);
      logActivity(
        'update',
        'season',
        `Saison courante : ${prevLabel} → ${selectedSeason.label}`
      );
      notifySuccess(
        `Les tarifs affichés sur le site passent de « Saison ${prevLabel} » à « Saison ${selectedSeason.label} ».`
      );
      await loadSeasons();
      setShowSetCurrentConfirm(false);
    } catch (err) {
      notifyError(err, 'Impossible de changer la saison affichée sur le site.');
    } finally {
      setSettingCurrent(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="manage-pricing">
      <PageHeader
        title="Tarifs"
        subtitle="Les tarifs s'affichent sur la page Tarifs du site et sur les fiches activités. Gérez-les par saison sportive."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.pricing)}
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateSeason}>
            <FontAwesomeIcon icon={faPlus} />
            Créer une nouvelle saison
          </button>
        }
      />

      <HelpTip text="En fin de saison, créez la nouvelle saison : les tarifs sont copiés automatiquement, vous n'avez qu'à ajuster les montants qui changent." />

      <div className="season-bar" role="group" aria-label="Choix de la saison">
        <span className="season-bar__label">Saison :</span>
        <div className="season-bar__chips">
          {seasons.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`season-chip ${selectedSeasonId === s.id ? 'active' : ''} ${s.isCurrent ? 'current' : ''}`}
              onClick={() => {
                setSelectedSeasonId(s.id);
                resetForm();
                trash.setView('active');
              }}
            >
              {s.isCurrent ? <FontAwesomeIcon icon={faStar} aria-hidden /> : null}
              Saison {s.label}
              {s.isCurrent ? <span className="season-chip__badge">Sur le site</span> : null}
            </button>
          ))}
        </div>
      </div>

      {isArchivedSeason ? (
        <div className="season-archive-banner" role="status">
          <p>
            Vous consultez une saison archivée ({seasonDisplayName(selectedSeason)}).
            Ces tarifs ne sont plus visibles sur le site public. Vous pouvez quand même
            corriger une erreur historique.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSetCurrentConfirm(true)}
          >
            Définir comme saison courante
          </button>
        </div>
      ) : null}

      {trash.view === 'active' ? (
        <section className="pricing-form-card modern-card">
          <h3>{editingKey ? `Modifier : ${form.label}` : 'Ajouter un tarif'}</h3>
          {isArchivedSeason ? (
            <p className="form-archive-hint">
              Vous modifiez une saison archivée : ces tarifs ne sont plus visibles sur le site public.
            </p>
          ) : null}
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
                onBlur={handleAmountBlur}
                error={fieldErrors.amount}
                required
                help="Indiquez 0 pour afficher « Gratuit » sur le site."
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
      ) : null}

      <TrashTabs
        view={trash.view}
        onViewChange={trash.setView}
        activeCount={rows.length}
        trashCount={trash.trashItems.length}
      />

      {trash.view === 'active' ? (
        <section className="pricing-table-wrap modern-card" aria-busy={loading}>
          {loading ? (
            <p className="admin-state--loading">
              <span className="admin-state__spinner" aria-hidden />
              Chargement…
            </p>
          ) : null}
          {error && !loading ? (
            <div className="admin-state--error" role="alert">
              {error}
            </div>
          ) : null}
          {!loading && !error ? (
            <DataTable
              columns={pricingColumns}
              data={rows}
              rowKey="priceKey"
              emptyMessage="Aucun tarif pour cette saison."
              className="pricing-table"
            />
          ) : null}
        </section>
      ) : (
        <TrashPanel
          items={trash.trashItems}
          loading={trash.trashLoading}
          emptyMessage="Aucun tarif en corbeille pour cette saison."
          getItemLabel={(row) => row.label}
          onRestore={trash.restoreItem}
          restoringId={trash.restoringId}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce tarif ?"
        itemLabel={deleteRow?.label}
        consequences={[
          'Le tarif sera déplacé en corbeille pendant 30 jours.',
          'Il disparaîtra de la page Tarifs pendant ce délai (si cette saison est affichée).',
          'Vous pourrez le restaurer depuis la corbeille.',
        ]}
        type="danger"
        danger
        confirmText="Supprimer"
      />

      <ConfirmDialog
        isOpen={showSetCurrentConfirm}
        onClose={() => setShowSetCurrentConfirm(false)}
        onConfirm={confirmSetCurrent}
        title="Changer la saison affichée sur le site ?"
        itemLabel={
          currentSeason && selectedSeason
            ? `${seasonDisplayName(currentSeason)} → ${seasonDisplayName(selectedSeason)}`
            : seasonDisplayName(selectedSeason)
        }
        consequences={[
          `Les tarifs affichés sur le site public passeront de « ${seasonDisplayName(currentSeason)} » à « ${seasonDisplayName(selectedSeason)} ».`,
          'Les visiteurs verront immédiatement les nouveaux montants.',
        ]}
        confirmText={settingCurrent ? 'Changement…' : 'Définir comme saison courante'}
      />

      <Modal
        isOpen={showCreateSeason}
        onClose={() => !creatingSeason && setShowCreateSeason(false)}
        title="Créer une nouvelle saison"
        size="md"
      >
        <div className="create-season-form">
          <p className="create-season-form__help">
            Les tarifs de la saison choisie seront copiés automatiquement. Vous n&apos;aurez
            qu&apos;à ajuster les montants qui changent.
          </p>
          <TextInput
            label="Libellé de la saison"
            name="season-label"
            value={seasonForm.label}
            onChange={(e) => setSeasonForm((f) => ({ ...f, label: e.target.value }))}
            error={seasonFieldErrors.label}
            required
            example="2026-2027"
            help="Années scolaires / sportives, ex. 2026-2027."
          />
          <div className="form-row form-row--inline">
            <TextInput
              label="Date de début"
              name="season-start"
              type="date"
              value={seasonForm.startsOn}
              onChange={(e) => setSeasonForm((f) => ({ ...f, startsOn: e.target.value }))}
              error={seasonFieldErrors.startsOn}
              required
            />
            <TextInput
              label="Date de fin"
              name="season-end"
              type="date"
              value={seasonForm.endsOn}
              onChange={(e) => setSeasonForm((f) => ({ ...f, endsOn: e.target.value }))}
              error={seasonFieldErrors.endsOn}
              required
            />
          </div>
          <SelectField
            label="Copier les tarifs depuis"
            name="season-copy-from"
            value={seasonForm.copyFromSeasonId}
            onChange={(e) =>
              setSeasonForm((f) => ({ ...f, copyFromSeasonId: e.target.value }))
            }
            error={seasonFieldErrors.copyFromSeasonId}
            required
            options={seasons.map((s) => ({
              value: String(s.id),
              label: `${seasonDisplayName(s)}${s.isCurrent ? ' (en cours sur le site)' : ''}`,
            }))}
            help="Tous les tarifs de cette saison seront dupliqués vers la nouvelle."
          />
          <div className="create-season-form__copy-note">
            <FontAwesomeIcon icon={faCopy} aria-hidden />
            <span>Les tarifs seront bien copiés : vous n&apos;aurez pas à tout ressaisir.</span>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateSeason}
              disabled={creatingSeason}
            >
              {creatingSeason ? 'Création…' : 'Créer la saison et copier les tarifs'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateSeason(false)}
              disabled={creatingSeason}
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagePricing;
