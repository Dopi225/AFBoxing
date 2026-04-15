import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faUsers, faLightbulb, faMapMarkerAlt, faHome, faEnvelope, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { activitiesApi } from '../services/apiService';
import SectionHeader from './SectionHeader';

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

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
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
        // console.error('Error loading social activities:', err);
        setError(err.message || 'Impossible de charger les activités sociales.');
        // Fallback sur données par défaut
        // setSocialActivities([
        //   {
        //     id: 'aide-devoirs',
        //     title: 'Aide aux devoirs',
        //     icon: faGraduationCap,
        //     description: 'Encadrement bienveillant pour soutenir les enfants dans leurs devoirs après l\'école.',
        //     details: 'Nos animateurs qualifiés accompagnent les enfants dans leurs devoirs dans un cadre bienveillant et structuré.',
        //     schedule: 'Lundi au Vendredi 16h30-18h00',
        //     age: '6-16 ans'
        //   }
        // ]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []); 

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
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Nos Activités Socio-éducatives
          </motion.h2>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Chargement des activités...</p>
          ) : socialActivities.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Aucune activité socio-éducative pour le moment.</p>
          ) : (
            <div className="modern-grid grid-3">
              {socialActivities.map((activity, index) => (
              <motion.div
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
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="social-cta">
        <div className="container">
          <div className="cta-grid">
            <motion.div 
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
            </motion.div>

            <motion.div 
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
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Actualite;
