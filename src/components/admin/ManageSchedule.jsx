import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTrash, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { scheduleApi, activitiesApi } from '../../services/apiService';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useDirtyBeforeUnload } from '../../hooks/useDirtyBeforeUnload';
import { validateActivityId } from '../../utils/formValidation';
import ConfirmDialog from './ConfirmDialog';
import { LoadingState, ErrorState } from '../PageStates';
import PageHeader from '../ui/PageHeader';
import { TextInput, SelectField } from '../ui/FormField';
import HelpTip from './guided/HelpTip';
import { EmptyStateGuided } from './guided';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { NAV_ITEMS } from '../../constants/adminCopy';
import './ManageSchedule.scss';

const DRAFT_KEY = 'afboxing_draft_schedule';

const defaultSchedule = [
  { day: 'Lundi', activities: [] },
  { day: 'Mardi', activities: [] },
  { day: 'Mercredi', activities: [] },
  { day: 'Jeudi', activities: [] },
  { day: 'Vendredi', activities: [] },
  { day: 'Samedi', activities: [] },
  { day: 'Dimanche', activities: [] },
];

const resolveSlotFromApi = (item, activityList) => {
  const label = item.activity || '';
  let activityId = item.activityId || '';
  if (!activityId && label && activityList.length) {
    const m = activityList.find(
      (a) => (a.scheduleActivityName && a.scheduleActivityName === label) || a.title === label
    );
    activityId = m?.id || '';
  }
  return { time: item.time, activityId, activity: label, level: item.level || 'Tous niveaux' };
};

const ManageSchedule = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyInfo } = useAdminNotify('schedule');
  const [activities, setActivities] = useState([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const savedBaselineRef = useRef(JSON.stringify(defaultSchedule));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [deleteSlot, setDeleteSlot] = useState(null);
  const [slotErrors, setSlotErrors] = useState({});

  const enabledActivities = useMemo(
    () => (activities || []).filter((a) => a.enabled !== false),
    [activities]
  );

  const hasChanges = JSON.stringify(schedule) !== savedBaselineRef.current;
  useDirtyBeforeUnload(hasChanges);

  const { clearDraft } = useFormDraft(DRAFT_KEY, schedule, {
    enabled: !loading && hasChanges,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [data, acts] = await Promise.all([scheduleApi.list(), activitiesApi.list()]);
        setActivities(Array.isArray(acts) ? acts : []);
        let next = defaultSchedule;
        if (data.length) {
          next = defaultSchedule.map((day) => ({
            day: day.day,
            activities: data
              .filter((item) => item.day === day.day)
              .map((item) => resolveSlotFromApi(item, acts)),
          }));
        }
        setSchedule(next);
        savedBaselineRef.current = JSON.stringify(next);
        try {
          const draftRaw = localStorage.getItem(DRAFT_KEY);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft && JSON.stringify(draft) !== savedBaselineRef.current) {
              setSchedule(draft);
              notifyInfo('Un brouillon du planning a été restauré. Enregistrez pour publier sur le site.');
            }
          }
        } catch {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (err) {
        setError(err.message || 'Impossible de charger le planning.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addActivity = (dayIndex) => {
    const pick = enabledActivities[0];
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.push({
      time: '18h00 - 19h00',
      activityId: pick?.id || '',
      activity: pick ? pick.scheduleActivityName || pick.title : '',
      level: 'Tous niveaux',
    });
    setSchedule(newSchedule);
  };

  const removeActivity = (dayIndex, activityIndex) => {
    setDeleteSlot({ dayIndex, activityIndex, slot: schedule[dayIndex].activities[activityIndex] });
  };

  const confirmRemoveSlot = () => {
    if (!deleteSlot) return;
    const { dayIndex, activityIndex } = deleteSlot;
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.splice(activityIndex, 1);
    setSchedule(newSchedule);
    setDeleteSlot(null);
    notifyInfo('Créneau retiré. Cliquez sur « Enregistrer le planning » pour appliquer sur le site.');
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[activityIndex][field] = value;
    setSchedule(newSchedule);
    if (field === 'activityId') {
      const key = `${dayIndex}-${activityIndex}`;
      setSlotErrors((prev) => ({ ...prev, [key]: validateActivityId(value) }));
    }
  };

  const setActivityFromId = (dayIndex, actIndex, activityId) => {
    const act = activities.find((a) => a.id === activityId);
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[actIndex] = {
      ...newSchedule[dayIndex].activities[actIndex],
      activityId,
      activity: act ? act.scheduleActivityName || act.title : '',
    };
    setSchedule(newSchedule);
    const key = `${dayIndex}-${actIndex}`;
    setSlotErrors((prev) => ({ ...prev, [key]: validateActivityId(activityId) }));
  };

  const validateAllSlots = () => {
    const errors = {};
    schedule.forEach((day, dayIndex) => {
      day.activities.forEach((slot, actIndex) => {
        const key = `${dayIndex}-${actIndex}`;
        const err = validateActivityId(slot.activityId);
        if (err) errors[key] = err;
      });
    });
    setSlotErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSchedule = async () => {
    if (!validateAllSlots()) {
      notifyError('Choisissez une activité pour chaque créneau avant d\'enregistrer.');
      return;
    }
    setSaving(true);
    try {
      const flat = [];
      schedule.forEach((day) => {
        day.activities.forEach((slot) => {
          const row = { day: day.day, time: slot.time, level: slot.level };
          if (slot.activityId) row.activityId = slot.activityId;
          else row.activity = slot.activity;
          flat.push(row);
        });
      });
      await scheduleApi.bulkSave(flat);
      savedBaselineRef.current = JSON.stringify(schedule);
      clearDraft();
      notifySuccess(`Planning enregistré (${flat.length} créneau${flat.length > 1 ? 'x' : ''}).`);
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer le planning.');
    } finally {
      setSaving(false);
      setShowSaveConfirm(false);
    }
  };

  return (
    <div className="manage-schedule">
      <PageHeader
        title="Planning"
        subtitle="Les créneaux s'affichent sur la page Horaires du site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.schedule)}
        actions={
          <>
            {hasChanges && (
              <span className="unsaved-indicator">Modifications non enregistrées</span>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSaveConfirm(true)}
              disabled={saving || !enabledActivities.length}
            >
              <FontAwesomeIcon icon={faSave} aria-hidden />
              {saving ? 'Enregistrement…' : 'Enregistrer le planning'}
            </button>
          </>
        }
      />

      <HelpTip
        text="Commencez par créer vos activités, puis ajoutez ici les créneaux horaires pour chaque jour."
        example="Lundi 18h00 - 19h00 : Boxe éducative, tous niveaux"
      />

      {!enabledActivities.length && !loading ? (
        <EmptyStateGuided
          icon={faCalendarAlt}
          title="Aucune activité"
          message="Créez d'abord vos activités, puis revenez ici pour définir les créneaux horaires."
          actionLabel="Créer une activité"
          onAction={() => navigate('/admin/activities')}
        />
      ) : null}

      {loading && <LoadingState label="Chargement du planning…" />}
      {error && !loading && <ErrorState title="Planning indisponible" message={error} onRetry={() => window.location.reload()} />}
      {!loading && !error ? (
        <div className="schedule-list">
          {schedule.map((day, dayIndex) => (
            <section key={day.day} className="day-card">
              <div className="day-header">
                <h3>{day.day}</h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-add"
                  onClick={() => addActivity(dayIndex)}
                  disabled={!enabledActivities.length}
                >
                  <FontAwesomeIcon icon={faPlus} aria-hidden /> Ajouter un créneau
                </button>
              </div>
              <div className="activities-list">
                {day.activities.length === 0 ? (
                  <p className="empty-message">Aucun créneau ce jour-là</p>
                ) : (
                  day.activities.map((slot, actIndex) => {
                    const errKey = `${dayIndex}-${actIndex}`;
                    return (
                      <div key={actIndex} className="activity-item">
                        <TextInput
                          label="Horaire"
                          name={`schedule-time-${dayIndex}-${actIndex}`}
                          value={slot.time}
                          onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                          placeholder="18h00 - 19h00"
                          className="activity-item__field"
                        />
                        <SelectField
                          label="Activité"
                          name={`schedule-activity-${dayIndex}-${actIndex}`}
                          value={slot.activityId || ''}
                          onChange={(e) => setActivityFromId(dayIndex, actIndex, e.target.value)}
                          onBlur={(e) => setActivityFromId(dayIndex, actIndex, e.target.value)}
                          error={slotErrors[errKey]}
                          className="activity-item__field"
                          options={[
                            { value: '', label: '— Choisir une activité —' },
                            ...enabledActivities.map((a) => ({
                              value: a.id,
                              label: a.scheduleActivityName || a.title,
                            })),
                          ]}
                        />
                        <TextInput
                          label="Niveau ou groupe"
                          name={`schedule-level-${dayIndex}-${actIndex}`}
                          value={slot.level}
                          onChange={(e) => updateActivity(dayIndex, actIndex, 'level', e.target.value)}
                          placeholder="Tous niveaux"
                          className="activity-item__field"
                        />
                        <button
                          type="button"
                          className="btn-delete activity-item__delete"
                          onClick={() => removeActivity(dayIndex, actIndex)}
                        >
                          <FontAwesomeIcon icon={faTrash} aria-hidden /> Supprimer
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={saveSchedule}
        title="Enregistrer le planning ?"
        message="Le planning affiché sur la page Horaires du site sera mis à jour."
        consequences={['Les visiteurs verront les nouveaux créneaux immédiatement.']}
        confirmText="Enregistrer"
      />

      <ConfirmDialog
        isOpen={!!deleteSlot}
        onClose={() => setDeleteSlot(null)}
        onConfirm={confirmRemoveSlot}
        title="Supprimer ce créneau ?"
        itemLabel={deleteSlot?.slot ? `${deleteSlot.slot.time} — ${deleteSlot.slot.activity || 'sans activité'}` : undefined}
        message="Le créneau sera retiré de la liste. Pensez à enregistrer le planning pour appliquer le changement sur le site."
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageSchedule;
