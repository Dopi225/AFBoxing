import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { scheduleApi } from '../../services/apiService';
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

const activityTypes = [
  'Boxe Éducative', 'Boxe Loisir', 'Boxe Amateur', 'Handiboxe', 'Aeroboxe', 'Boxe Thérapie'
];

const ManageSchedule = () => {
  const { success, error: notifyError } = useNotifications();
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await scheduleApi.list();
        if (data.length === 0) {
          setSchedule(defaultSchedule);
        } else {
          const byDay = defaultSchedule.map(day => ({
            day: day.day,
            activities: data
              .filter(item => item.day === day.day)
              .map(item => ({
                time: item.time,
                activity: item.activity,
                level: item.level || ''
              }))
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
    const newSchedule = [...schedule];
    newSchedule[dayIndex].activities.push({
      time: '18h00-19h00',
      activity: 'Boxe Loisir',
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

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const flat = [];
      schedule.forEach(day => {
        day.activities.forEach(activity => {
          flat.push({
            day: day.day,
            time: activity.time,
            activity: activity.activity,
            level: activity.level
          });
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
        <h2>Gestion du Planning</h2>
        <button className="btn-primary" onClick={saveSchedule} disabled={saving}>
          <FontAwesomeIcon icon={faSave} />
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder le planning'}
        </button>
      </div>

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
              <button className="btn-add" onClick={() => addActivity(dayIndex)}>
                <FontAwesomeIcon icon={faPlus} />
                Ajouter
              </button>
            </div>

            <div className="activities-list">
              {day.activities.length === 0 ? (
                <p className="empty-message">Aucune activité programmée</p>
              ) : (
                day.activities.map((activity, actIndex) => (
                  <div key={actIndex} className="activity-item">
                    <div className="activity-time">
                      <FontAwesomeIcon icon={faClock} />
                      <input
                        type="text"
                        value={activity.time}
                        onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                        placeholder="18h00-19h00"
                      />
                    </div>
                    <select
                      value={activity.activity}
                      onChange={(e) => updateActivity(dayIndex, actIndex, 'activity', e.target.value)}
                    >
                      {activityTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={activity.level}
                      onChange={(e) => updateActivity(dayIndex, actIndex, 'level', e.target.value)}
                      placeholder="Niveau"
                    />
                    <button
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

