import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faHeart, faMusic, faBrain, faWheelchair, faCalendarAlt, faTrophy, faClock, faUsers } from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { scheduleApi, activitiesApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
import pratique from '../assets/pratique.jpg'; 

const iconMap = {
  faFistRaised,
  faGraduationCap,
  faHeart,
  faMusic,
  faBrain,
  faWheelchair,
  faUsers
};

const Activite = () => {
  const navigate = useNavigate(); 
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError('');
      try {
        const data = await scheduleApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setScheduleItems(list);
      } catch (err) {
        setScheduleError(err.message || "Impossible de charger le planning depuis l'API.");
        setScheduleItems([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    const loadActivities = async () => {
      try {
        const data = await activitiesApi.list();
        
        // Filtrer UNIQUEMENT les activités de boxe
        const boxingActivities = data
          .filter(a => a.kind === 'boxing' && a.enabled)
          .map(a => ({
            id: a.id,
            title: a.title,
            icon: a.icon && iconMap[a.icon] ? iconMap[a.icon] : faFistRaised,
            description: a.subtitle,
            age: a.meta?.age || 'Tous âges',
            level: 'Tous niveaux',
            color: 'var(--primary-red)'
          }));
          setActivities(boxingActivities);
        
        // setActivities(boxingActivities.length > 0 ? boxingActivities : [
        //   {
        //     id: 'educative',
        //     title: 'Boxe Éducative',
        //     icon: faGraduationCap,
        //     description: 'Adaptée aux jeunes de 8 à 17 ans, axée sur la technique sans contact, apprentissage et valeurs citoyennes.',
        //     age: '8-17 ans',
        //     level: 'Débutant',
        //     color: 'var(--primary-red)'
        //   }
        // ]);
      } catch (err) {
        // console.error('Error loading activities:', err);
        setError(err.message || 'Impossible de charger les activités sportives.');
        // Fallback sur données par défaut si l'API échoue
        // setActivities([
        //   {
        //     id: 'educative',
        //     title: 'Boxe Éducative',
        //     icon: faGraduationCap,
        //     description: 'Adaptée aux jeunes de 8 à 17 ans, axée sur la technique sans contact, apprentissage et valeurs citoyennes.',
        //     age: '8-17 ans',
        //     level: 'Débutant',
        //     color: 'var(--primary-red)'
        //   }
        // ]);
      }
    };

    loadSchedule();
    loadActivities();
  }, []);

  const nextSessions = useMemo(() => {
    const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const items = (scheduleItems || []).slice().sort((a, b) => {
      const da = DAY_ORDER.indexOf(a?.day || '');
      const db = DAY_ORDER.indexOf(b?.day || '');
      if (da !== db) return da - db;
      return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
    return items.slice(0, 3);
  }, [scheduleItems]);


  return (
    <div className="container-fluid">
      <SectionHeader
        title="Activités"
        subtitle="Des séances pour tous les profils : jeunes, adultes, compétition, cardio, inclusion et bien-être — avec un encadrement progressif."
        eyebrow="Boxe • Santé • Inclusion"
        image={pratique}
        actions={[
          { label: "Horaires", to: "/horaire", className: "btn-primary", icon: <FontAwesomeIcon icon={faCalendarAlt} /> },
          { label: 'Tarifs et inscription', to: '/tarif', className: 'btn-secondary', icon: <FontAwesomeIcon icon={faFistRaised} /> },
          { label: "Socio-éducatif", to: "/actualite", className: "btn-outline", icon: <FontAwesomeIcon icon={faGraduationCap} /> },
        ]}
      />

      {/* Activities Grid Moderne */}
      <section className="content-section"> 
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Choisissez votre pratique
          </motion.h2>
          
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-light, #555)' }}>
            Activités de boxe anglaise pour tous les niveaux et tous les âges
          </p>
          
          <div className="modern-grid grid-3">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="modern-card activity-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigate(`/info/${activity.id}`)}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="card-header">
                  <FontAwesomeIcon 
                    icon={activity.icon} 
                    className="card-icon"
                    style={{ color: activity.color }}
                  />
                  <h3>{activity.title}</h3>
                </div>
                
                <div className="card-content">
                  <p>{activity.description}</p>
                  
                  <div className="activity-info">
                    <div className="info-item">
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{activity.age}</span>
                    </div>
                    <div className="info-item">
                      <FontAwesomeIcon icon={faFistRaised} />
                      <span>{activity.level}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-footer">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/info/${activity.id}`)}
                  >
                    <FontAwesomeIcon icon={faFistRaised} />
                    En savoir plus
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section (données API) */}
      <section className="content-section section-white">
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Horaires d'entraînement
          </motion.h2>
          
          <div className="modern-card">
            <div className="card-header" style={{ textAlign: 'center' }}>
              <FontAwesomeIcon icon={faClock} className="card-icon" />
              <h3>Prochains créneaux (API)</h3>
            </div>
            <div className="card-content">
              {scheduleLoading && <p>Chargement…</p>}
              {!scheduleLoading && scheduleError && <p>{scheduleError}</p>}
              {!scheduleLoading && !scheduleError && nextSessions.length === 0 && (
                <p>Planning non renseigné pour le moment.</p>
              )}
              {!scheduleLoading && !scheduleError && nextSessions.length > 0 && (
                <p style={{ margin: 0 }}>
                  {nextSessions.map((s, idx) => (
                    <span key={`${s.day}-${s.time}-${idx}`}>
                      {idx === 0 ? '' : <br />}
                      <strong>{s.day}</strong> — {s.time} — {s.activity}{s.level ? ` (${s.level})` : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="card-footer" style={{ textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/horaire')}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                Voir le planning complet
              </button>
            </div>
          </div>
          
        </div>
      </section>

      {/* CTA Section Moderne */}
      <section className="content-section section-dark">
        <div className="container">
          <div className="modern-grid grid-2">
            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="cta-icon-container">
                <FontAwesomeIcon icon={faCalendarAlt} className="cta-icon" />
              </div>
              <h3>Planning détaillé</h3>
              <p>Consultez les horaires spécifiques pour chaque activité.</p>
              <button className="btn btn-primary" onClick={() => navigate('/horaire')}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                Voir le planning
              </button>
            </motion.div>

            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="cta-icon-container">
                <FontAwesomeIcon icon={faTrophy} className="cta-icon" />
              </div>
              <h3>Palmarès</h3>
              <p>Résultats, événements et moments marquants du club.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/palmares')}>
                <FontAwesomeIcon icon={faTrophy} />
                Voir le palmarès
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Activite;
