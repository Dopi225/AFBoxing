import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { scheduleApi, activitiesApi } from '../../services/apiService';
import { useNotifications } from './NotificationSystem';
import './ManageSchedule.scss';

const defaultSchedule = [
  { day: 'Lundi', activities: [] },
  { day: 'Mardi', activities: [] },
  { day: 'Mercredi', activities: [] },
  { day: 'Jeudi', activities: [] },
  { day: 'Vendredi', activities: [] },
  { day: 'Samedi', activities: [] },
  { day: 'Dimanche', activities: [] }
];

/** Associe une ligne API planning à une activité (par activityId ou par libellé). */
const resolveSlotFromApi = (item, activityList) => {
  const label = item.activity || '';
  let activityId = item.activityId || '';
  if (!activityId && label && activityList.length) {
    const m = activityList.find(
      (a) =>
        (a.scheduleActivityName && a.scheduleActivityName === label) ||
        a.title === label
    );
    activityId = m?.id || '';
  }
  return {
    time: item.time,
    activityId,
    activity: label,
    level: item.level || ''
  };
};

const ManageSchedule = () => {
  const { success, error: notifyError } = useNotifications();
  const [activities, setActivities] = useState([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const enabledActivities = useMemo(
    () => (activities || []).filter((a) => a.enabled !== false),
    [activities]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [data, acts] = await Promise.all([scheduleApi.list(), activitiesApi.list()]);
        setActivities(Array.isArray(acts) ? acts : []);

        if (!data.length) {
          setSchedule(defaultSchedule);
        } else {
          const byDay = defaultSchedule.map((day) => ({
            day: day.day,
            activities: data
              .filter((item) => item.day === day.day)
              .map((item) => resolveSlotFromApi(item, Array.isArray(acts) ? acts : []))
          }));
          setSchedule(byDay);
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
      time: '18h00-19h00',
      activityId: pick?.id || '',
      activity: pick ? (pick.scheduleActivityName || pick.title) : '',
      level: 'Tous niveaux'
    });
    setSchedule(newSchedule);
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.splice(activityIndex, 1);
    setSchedule(newSchedule);
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[activityIndex][field] = value;
    setSchedule(newSchedule);
  };

  const setActivityFromId = (dayIndex, actIndex, activityId) => {
    const act = activities.find((a) => a.id === activityId);
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities[actIndex] = {
      ...newSchedule[dayIndex].activities[actIndex],
      activityId,
      activity: act ? (act.scheduleActivityName || act.title) : ''
    };
    setSchedule(newSchedule);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const flat = [];
      schedule.forEach((day) => {
        day.activities.forEach((slot) => {
          const row = {
            day: day.day,
            time: slot.time,
            level: slot.level
          };
          if (slot.activityId) {
            row.activityId = slot.activityId;
          } else {
            row.activity = slot.activity;
          }
          flat.push(row);
        });
      });
      await scheduleApi.bulkSave(flat);
      success(`✅ Planning sauvegardé avec succès ! (${flat.length} créneaux)`);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la sauvegarde du planning.';
      notifyError(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-schedule">
      <div className="page-header">
        <div>
          <h2>Gestion du planning</h2>
          <p className="page-subtitle">
            Chaque créneau est lié à une <strong>activité</strong> définie dans « Activités ». Le libellé affiché sur le
            site reprend le champ « nom pour le planning » de l’activité.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={saveSchedule} disabled={saving || !enabledActivities.length}>
          <FontAwesomeIcon icon={faSave} />
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder le planning'}
        </button>
      </div>

      {!enabledActivities.length && !loading && (
        <p className="manage-schedule__warning">
          Aucune activité activée : créez d’abord des activités dans la section Activités.
        </p>
      )}

      {loading && (
        <div className="schedule-list">
          <p>Chargement du planning...</p>
        </div>
      )}
      {error && !loading && (
        <div className="schedule-list">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && (
      <div className="schedule-list">
        {schedule.map((day, dayIndex) => (
          <motion.div
            key={day.day}
            className="day-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
          >
            <div className="day-header">
              <h3>{day.day}</h3>
              <button type="button" className="btn-add" onClick={() => addActivity(dayIndex)} disabled={!enabledActivities.length}>
                <FontAwesomeIcon icon={faPlus} />
                Ajouter
              </button>
            </div>

            <div className="activities-list">
              {day.activities.length === 0 ? (
                <p className="empty-message">Aucune activité programmée</p>
              ) : (
                day.activities.map((slot, actIndex) => (
                  <div key={actIndex} className="activity-item">
                    <div className="activity-time">
                      <FontAwesomeIcon icon={faClock} />
                      <input
                        type="text"
                        value={slot.time}
                        onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                        placeholder="18h00-19h00"
                      />
                    </div>
                    <select
                      className="activity-select"
                      value={slot.activityId || ''}
                      onChange={(e) => setActivityFromId(dayIndex, actIndex, e.target.value)}
                      aria-label="Activité du club"
                    >
                      <option value="">— Choisir une activité —</option>
                      {enabledActivities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.scheduleActivityName || a.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={slot.level}
                      onChange={(e) => updateActivity(dayIndex, actIndex, 'level', e.target.value)}
                      placeholder="Niveau / groupe"
                    />
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => removeActivity(dayIndex, actIndex)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ManageSchedule;
