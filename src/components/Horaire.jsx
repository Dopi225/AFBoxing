import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarAlt, faUsers, faFistRaised, faGraduationCap, faHeart, faMusic, faBrain, faWheelchair } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { scheduleApi } from '../services/apiService';
import SectionHeader from './SectionHeader';

const defaultSchedule = [
  { day: 'Lundi', activities: [] },
  { day: 'Mardi', activities: [] },
  { day: 'Mercredi', activities: [] },
  { day: 'Jeudi', activities: [] },
  { day: 'Vendredi', activities: [] },
  { day: 'Samedi', activities: [] },
  { day: 'Dimanche', activities: [] }
];

const Horaire = () => {
  const [schedule, setSchedule] = React.useState(defaultSchedule);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('Tous');
  const [viewMode, setViewMode] = React.useState('semaine'); // 'semaine' | 'aujourdhui'
  const [layoutMode, setLayoutMode] = React.useState(() => (window.innerWidth >= 900 ? 'table' : 'cartes')); // 'table' | 'cartes'

  const activityTypes = [
    'Boxe Éducative',
    'Boxe Loisir',
    'Boxe Amateur',
    'Handiboxe',
    'Aeroboxe',
    'Boxe Thérapie'
  ];

  const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayName = FRENCH_DAYS[new Date().getDay()];
  const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900) setLayoutMode('cartes');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await scheduleApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (!list || list.length === 0) {
          setSchedule(defaultSchedule);
        } else {
          const byDay = defaultSchedule.map(day => ({
            day: day.day,
            activities: list
              .filter(item => item.day === day.day)
              .map(item => ({
                time: item.time,
                activity: item.activity,
                level: item.level || '',
                icon: getIconForActivity(item.activity)
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

  const getActivityColor = (activity) => {
    const colors = {
      'Boxe Éducative': 'var(--primary-red)',
      'Boxe Loisir': 'var(--primary-red-dark)',
      'Boxe Amateur': 'var(--primary-black)',
      'Handiboxe': 'var(--primary-red)',
      'Aeroboxe': 'var(--primary-red-dark)',
      'Boxe Thérapie': 'var(--primary-black)'
    };
    return colors[activity] || 'var(--primary-red)';
  };

  const getActivityTone = (activity) => {
    switch (activity) {
      case 'Boxe Loisir':
      case 'Aeroboxe':
        return 'red-dark';
      case 'Boxe Amateur':
      case 'Boxe Thérapie':
        return 'black';
      case 'Boxe Éducative':
      case 'Handiboxe':
      default:
        return 'red';
    }
  };

  const parseStartMinutes = (timeRange) => {
    const raw = String(timeRange || '').split('-')[0]?.trim() || '';
    const normalized = raw.replace('h', ':').replace('H', ':').replace(/\s+/g, '');
    const [hStr, mStr] = normalized.split(':');
    const h = Number.parseInt(hStr, 10);
    const m = Number.parseInt(mStr || '0', 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const buildNextOccurrence = (dayName, timeRange) => {
    const now = new Date();
    const todayIndex = now.getDay(); // 0 = Dimanche
    const targetIndex = FRENCH_DAYS.indexOf(dayName);
    if (targetIndex < 0) return null;

    const startMinutes = parseStartMinutes(timeRange);
    if (startMinutes === null) return null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let diffDays = targetIndex - todayIndex;
    if (diffDays < 0) diffDays += 7;
    if (diffDays === 0 && startMinutes <= nowMinutes) diffDays = 7;

    const date = new Date(now);
    date.setDate(now.getDate() + diffDays);
    date.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    return date;
  };

  const getIconForActivity = (activity) => {
    switch (activity) {
      case 'Boxe Éducative':
        return faGraduationCap;
      case 'Boxe Loisir':
        return faHeart;
      case 'Boxe Amateur':
        return faFistRaised;
      case 'Handiboxe':
        return faWheelchair;
      case 'Aeroboxe':
        return faMusic;
      case 'Boxe Thérapie':
        return faBrain;
      default:
        return faFistRaised;
    }
  };

  const filteredSchedule = React.useMemo(() => {
    const filterDay = (day) => {
      const activities = (day.activities || []).filter((a) => {
        if (activeFilter === 'Tous') return true;
        return a.activity === activeFilter;
      });
      return { ...day, activities };
    };

    const base = schedule.map(filterDay);
    if (viewMode === 'aujourdhui') {
      return base.filter((d) => d.day === todayName);
    }
    return base;
  }, [schedule, activeFilter, viewMode, todayName]);

  const flatSessions = React.useMemo(() => {
    const sessions = filteredSchedule
      .flatMap((day) =>
        (day.activities || []).map((a) => ({
          day: day.day,
          time: a.time,
          activity: a.activity,
          level: a.level || '',
          icon: a.icon
        }))
      )
      .slice()
      .sort((a, b) => {
        const da = DAY_ORDER.indexOf(a.day);
        const db = DAY_ORDER.indexOf(b.day);
        if (da !== db) return da - db;
        return (parseStartMinutes(a.time) ?? 9999) - (parseStartMinutes(b.time) ?? 9999);
      });
    return sessions;
  }, [filteredSchedule]);

  const nextSession = React.useMemo(() => {
    const now = new Date();
    const candidates = (schedule || [])
      .flatMap((d) => (d.activities || []).map((a) => ({ day: d.day, ...a })))
      .filter((s) => {
        if (activeFilter === 'Tous') return true;
        return s.activity === activeFilter;
      })
      .map((s) => {
        const nextDate = buildNextOccurrence(s.day, s.time);
        if (!nextDate) return null;
        return { ...s, nextDate };
      })
      .filter(Boolean)
      .filter((s) => s.nextDate >= now)
      .sort((a, b) => a.nextDate - b.nextDate);

    return candidates[0] || null;
  }, [schedule, activeFilter]);

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Horaires"
        subtitle="Consultez le planning complet par activité. Filtrez, basculez entre semaine/aujourd’hui, et trouvez votre prochain entraînement."
        eyebrow="Rapide à lire • Mobile-first"
        actions={[
          { label: 'Tarifs et inscription', to: '/tarif', className: 'btn-primary' },
          { label: "Contact", to: "/contact", className: "btn-secondary" },
        ]}
      />

      {/* Schedule Section */}
      <section className="schedule-main">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Planning
          </motion.h2>

          <div className="schedule-toolbar" role="region" aria-label="Filtres du planning">
            <div className="schedule-toolbar__left">
              <div className="segmented" role="tablist" aria-label="Mode d'affichage">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'semaine'}
                  className={`segmented__btn ${viewMode === 'semaine' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('semaine')}
                >
                  Semaine
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'aujourdhui'}
                  className={`segmented__btn ${viewMode === 'aujourdhui' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('aujourdhui')}
                >
                  Aujourd’hui
                </button>
              </div>

              <div className="segmented" role="tablist" aria-label="Mode de lecture">
                <button
                  type="button"
                  role="tab"
                  aria-selected={layoutMode === 'table'}
                  className={`segmented__btn ${layoutMode === 'table' ? 'is-active' : ''}`}
                  onClick={() => setLayoutMode('table')}
                >
                  Tableau
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={layoutMode === 'cartes'}
                  className={`segmented__btn ${layoutMode === 'cartes' ? 'is-active' : ''}`}
                  onClick={() => setLayoutMode('cartes')}
                >
                  Cartes
                </button>
              </div>
            </div>

            <div className="schedule-toolbar__right">
              <div className="chips" aria-label="Filtrer par activité">
                <button
                  type="button"
                  className={`chip ${activeFilter === 'Tous' ? 'is-active' : ''}`}
                  onClick={() => setActiveFilter('Tous')}
                >
                  Tous
                </button>
                {activityTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${activeFilter === t ? 'is-active' : ''}`}
                    onClick={() => setActiveFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!loading && !error && nextSession && (
            <div className="schedule-next" role="region" aria-label="Prochain entraînement">
              <div className="schedule-next__content">
                <div className="schedule-next__label">Prochain entraînement</div>
                <div className="schedule-next__title">
                  <span className={`schedule-badge schedule-badge--${getActivityTone(nextSession.activity)}`}>
                    {nextSession.activity}
                  </span>
                  <span className="schedule-next__meta">
                    {nextSession.day} • {nextSession.time}{nextSession.level ? ` • ${nextSession.level}` : ''}
                  </span>
                </div>
              </div>
              <div className="schedule-next__actions">
                <button className="btn btn-primary" type="button" onClick={() => window.location.assign('/tarif')}>
                  Tarifs & inscription
                </button>
                <button className="btn btn-outline" type="button" onClick={() => window.location.assign('/contact')}>
                  Contact
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="schedule-legend" aria-label="Légende des activités">
              <span className="schedule-legend__label">Légende :</span>
              <div className="schedule-legend__items">
                {activityTypes.map((t) => (
                  <span key={t} className={`schedule-badge schedule-badge--${getActivityTone(t)}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="schedule-grid">
              <p>Chargement du planning...</p>
            </div>
          )}
          {error && !loading && (
            <div className="schedule-grid">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (
          <>
          {layoutMode === 'table' && (
            <div className="schedule-table-wrap" role="region" aria-label="Planning en tableau">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th scope="col">Jour</th>
                    <th scope="col">Horaire</th>
                    <th scope="col">Activité</th>
                    <th scope="col">Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {flatSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="schedule-table__empty">Aucun créneau pour ce filtre.</td>
                    </tr>
                  ) : (
                    flatSessions.map((s, idx) => (
                      <tr key={`${s.day}-${s.time}-${s.activity}-${idx}`}>
                        <td className="schedule-table__day">{s.day}</td>
                        <td className="schedule-table__time">{s.time}</td>
                        <td>
                          <span className={`schedule-badge schedule-badge--${getActivityTone(s.activity)}`}>
                            {s.activity}
                          </span>
                        </td>
                        <td className="schedule-table__level">{s.level || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {layoutMode === 'cartes' && (
          <div className="schedule-grid">
            {filteredSchedule.map((day, index) => (
              <motion.div
                key={day.day}
                className="day-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="day-header">
                  <FontAwesomeIcon icon={faCalendarAlt} className="day-icon" />
                  <h3>{day.day}</h3>
                </div>
                
                <div className="activities-list">
                  {day.activities.length === 0 ? (
                    <p className="schedule-empty">Aucun créneau pour ce filtre.</p>
                  ) : day.activities.map((activity, actIndex) => (
                    <motion.div
                      key={actIndex}
                      className="activity-slot"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: actIndex * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="time-slot">
                        <FontAwesomeIcon icon={faClock} />
                        <span>{activity.time}</span>
                      </div>
                      
                      <div className="activity-details">
                        <div className="activity-info">
                          <FontAwesomeIcon 
                            icon={activity.icon} 
                            className="activity-icon"
                            style={{ color: getActivityColor(activity.activity) }}
                          />
                          <div>
                            <h4>{activity.activity}</h4>
                            <span className="level">{activity.level}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          )}
          </>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="schedule-info">
        <div className="container">
          <motion.div 
            className="info-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Informations pratiques</h2>
            <div className="info-grid">
              <div className="info-card">
                <FontAwesomeIcon icon={faUsers} className="info-icon" />
                <h3>Inscription</h3>
                <p>Les inscriptions se font toute l'année. Premier cours d'essai gratuit pour tous les nouveaux membres.</p>
              </div>
              
              <div className="info-card">
                <FontAwesomeIcon icon={faClock} className="info-icon" />
                <h3>Ponctualité</h3>
                <p>Merci d'arriver 10 minutes avant le début de votre cours pour l'échauffement et la préparation.</p>
              </div>
              
              <div className="info-card">
                <FontAwesomeIcon icon={faFistRaised} className="info-icon" />
                <h3>Équipement</h3>
                <p>Gants et protège-dents fournis. Prévoir une tenue de sport et des chaussures de sport propres.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Horaire;
