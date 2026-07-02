import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faUsers, faLightbulb, faMapMarkerAlt, faHome, faEnvelope, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { activitiesApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
import { EmptyState, ErrorState, InlineLoading } from './PageStates';
import '../style/Actualite.scss';

const iconMap = {
  faGraduationCap,
  faUsers,
  faLightbulb,
  faMapMarkerAlt,
  faHome
};

const Actualite = () => {
  const navigate = useNavigate();
  const [socialActivities, setSocialActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await activitiesApi.list();
      const social = data
        .filter(a => a.kind === 'social' && a.enabled)
        .map(a => {
          const icon = a.icon && iconMap[a.icon] ? iconMap[a.icon] : faGraduationCap;
          return {
            id: a.id,
            title: a.title,
            icon: icon,
            description: a.subtitle,
            details: (a.sections || []).map(s =>
              [...(s.paragraphs || []), ...(s.bullets || [])].join(' ')
            ).join(' '),
            schedule: a.meta?.scheduleText || 'Sur demande',
            age: a.meta?.age || 'Tous âges'
          };
        });
      setSocialActivities(social);
    } catch (err) {
      setError(err.message || 'Impossible de charger les activités sociales.');
      setSocialActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]); 

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Pôle socio-éducatif"
        subtitle="Accompagner, encourager, créer du lien : des actions concrètes pour soutenir les jeunes et les familles, au-delà du sport."
        eyebrow="Humain • Solidaire • Inclusif"
        actions={[
          { label: "Tarifs", to: "/tarif", className: "btn-primary", icon: <FontAwesomeIcon icon={faFileSignature} /> },
          { label: "Contact", to: "/contact", className: "btn-outline", icon: <FontAwesomeIcon icon={faEnvelope} /> },
        ]}
      />

      {/* Activities Section Moderne */}
      <section className="content-section">
        <div className="container">
          <Motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nos Activités Socio-éducatives
          </Motion.h2>
          
          {loading ? (
            <div className="actualite-loading">
              <InlineLoading label="Chargement des activités…" />
            </div>
          ) : error ? (
            <ErrorState title="Impossible de charger les activités" message={error} onRetry={() => void loadActivities()} />
          ) : socialActivities.length === 0 ? (
            <EmptyState title="Aucune activité pour le moment">
              Les activités socio-éducatives apparaîtront ici lorsqu’elles seront publiées.
            </EmptyState>
          ) : (
            <div className="modern-grid grid-3">
              {socialActivities.map((activity, index) => (
              <Motion.div
                key={activity.id}
                className="modern-card activity-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="card-header">
                  <FontAwesomeIcon icon={activity.icon} className="card-icon" />
                  <h3>{activity.title}</h3>
                </div>
                
                <div className="card-content">
                  <p className="description">{activity.description}</p>
                  
                  <div className="activity-info">
                    <div className="info-item"> 
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{activity.age}</span>
                    </div>
                    <div className="info-item">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>{activity.schedule}</span>
                    </div>
                  </div>
                  
                  <div className="details">
                    <p>{activity.details}</p>
                  </div>
                </div>
                
                <div className="card-footer">
                  <button 
                    className="btn btn-primary btn-full"
                    onClick={() => navigate(`/info/${activity.id}`)}
                  >
                    En savoir plus
                  </button>
                </div>
              </Motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="social-cta">
        <div className="container">
          <div className="cta-grid">
            <Motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faEnvelope} className="cta-icon" />
              <h3>Nous contacter</h3>
              <p>Pour connaître les créneaux, les modalités et l’accompagnement possible.</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                Nous écrire
              </button>
            </Motion.div>

            <Motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
              <h3>Inscription</h3>
              <p>Retrouvez les tarifs et les documents utiles.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/tarif')}>
                S'inscrire
              </button>
            </Motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Actualite;
