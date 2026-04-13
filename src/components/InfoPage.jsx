import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faCalendarAlt, faTrophy, faEnvelope, faFileSignature, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { scheduleApi, activitiesApi, pricingApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
import {
  faFistRaised as faFistRaisedIcon,
  faGraduationCap as faGraduationCapIcon,
  faHeart,
  faMusic,
  faBrain,
  faWheelchair,
  faUsers,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons'; 

const formatPrice = (price) => {
  if (!price) return '—';
  if (price.amount === 0) return 'Gratuit';
  if (typeof price.amount === 'number') return `${price.amount}€`;
  return String(price.amount);
};

const iconMap = {
  faFistRaised: faFistRaisedIcon,
  faGraduationCap: faGraduationCapIcon,
  faHeart,
  faMusic,
  faBrain,
  faWheelchair,
  faUsers,
  faLightbulb
};

// Fix ESLint no-unused-vars dans certains setups: l'analyse ne voit pas `motion.*` en JSX.
// (variable inutilisée autorisée car commence par "_")
const _MOTION = motion;

const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const InfoPage = () => {
  const navigate = useNavigate(); 
  const { type } = useParams();

  const [info, setInfo] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);

  // Charger l'activité depuis l'API
  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true);
      try {
        const activities = await activitiesApi.list();
        const activity = activities.find(a => a.id === type && a.enabled);
        
        if (activity) {
          setInfo(activity);
          setAllActivities(activities);
          
          // Charger le tarif correspondant
          if (activity.meta?.priceKey) {
            try {
              const priceData = await pricingApi.get(activity.meta.priceKey);
              if (priceData) {
                setPricing(priceData);
              }
            } catch {
              // Tarif non trouvé, on continue sans
            }
          }
        } else {
          setInfo(null);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Error loading activity:', err);
        }
        setInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (type) {
      loadActivity();
    }
  }, [type]);

  // Charger les horaires
  useEffect(() => {
    if (!info?.scheduleActivityName) {
      setScheduleItems([]);
      setScheduleError('');
      setScheduleLoading(false);
      return;
    }

    const load = async () => {
      setScheduleLoading(true);
      setScheduleError('');
      try {
        const data = await scheduleApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setScheduleItems(list.filter((s) => s?.activity === info.scheduleActivityName));
      } catch (err) {
        setScheduleError(err.message || "Impossible de charger les horaires depuis l'API.");
        setScheduleItems([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    load();
  }, [info]);

  const groupedSchedule = React.useMemo(() => {
    const groups = new Map();
    (scheduleItems || []).forEach((s) => {
      const day = s?.day || '';
      if (!day) return;
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(s);
    });

    return Array.from(groups.entries())
      .sort((a, b) => DAY_ORDER.indexOf(a[0]) - DAY_ORDER.indexOf(b[0]))
      .map(([day, items]) => ({
        day,
        items: (items || []).slice().sort((x, y) => String(x?.time || '').localeCompare(String(y?.time || '')))
      }));
  }, [scheduleItems]);

  if (loading) {
    return (
      <div className="container-fluid">
        <section className="error-section">
          <div className="container">
            <h1>Chargement...</h1>
            <p>Chargement de l'activité en cours.</p>
          </div>
        </section>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="container-fluid">
        <section className="error-section">
          <div className="container">
            <h1>Activité non trouvée</h1>
            <p>L'activité demandée n'existe pas ou n'est pas activée.</p>
            <button className="btn btn-primary" onClick={() => navigate('/activite')}>
              Retour aux activités
            </button>
          </div>
        </section>
      </div>
    );
  }


  return (
    <div className="container-fluid">
      <SectionHeader
        className="info-page-header"
        title={info.title}
        subtitle={info.subtitle}
        eyebrow={info.eyebrow}
        actions={[
          { label: "Tarifs", to: "/tarif", className: "btn-primary", icon: <FontAwesomeIcon icon={faFileSignature} /> },
          { label: "Contact", to: "/contact", className: "btn-outline", icon: <FontAwesomeIcon icon={faEnvelope} /> },
          { label: "Horaires", to: "/horaire", className: "btn-secondary", icon: <FontAwesomeIcon icon={faCalendarAlt} /> },
        ]}
      >
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="hero-badge" style={{ margin: 0 }}>
            <span className="badge-text">{info.kind === 'boxing' ? 'Boxe' : 'Socio-éducatif'}</span>
          </span>
          <span className="hero-badge" style={{ margin: 0 }}>
            <span className="badge-text">{info.meta?.age}</span>
          </span>
        </div>
      </SectionHeader>

      {/* Content Section */}
      <section className="info-content">
        <div className="container">
          <div className="content-grid">
            <motion.div 
              className="main-content"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="content-card">
                <div className="content-header">
                  <h2>Présentation</h2>
                  <div className="content-divider"></div>
                </div>
                <div className="content-text">
                  {(info.sections || []).map((block, idx) => (
                    <div key={`${block.title}-${idx}`} style={{ marginBottom: '1.6rem' }}>
                      <h3 style={{ margin: '0 0 0.75rem', fontWeight: 900 }}>{block.title}</h3>
                      {(block.paragraphs || []).map((p, pIdx) => (
                        <motion.p
                          key={`${idx}-p-${pIdx}`}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: pIdx * 0.05 }}
                          viewport={{ once: true }}
                        >
                          {p}
                        </motion.p>
                      ))}
                      {(block.bullets || []).length ? (
                        <ul className="info-bullets">
                          {block.bullets.map((b, bIdx) => (
                            <li key={`${idx}-b-${bIdx}`}>{b}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="info-sidebar"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="info-card">
                <div className="info-card-header">
                  <div className="header-content">
                    <h3>Informations pratiques</h3>
                    <p>Détails de l'activité</p>
                  </div>
                  <div className="info-card-icon">
                    <FontAwesomeIcon icon={faFistRaised} />
                  </div>
                </div>
                
                <div className="info-sections">
                  {/* Section Âge */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon age-icon">
                        <FontAwesomeIcon icon={faGraduationCap} />
                      </div>
                      <h4>Public</h4>
                    </div>
                    <div className="section-content">
                      <span className="section-value">{info.meta?.age}</span>
                    </div>
                  </motion.div>
                  
                  {/* Section Horaires */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon schedule-icon">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                      <h4>Horaires</h4>
                    </div>
                    <div className="section-content">
                      {info.scheduleActivityName ? (
                        <>
                          {scheduleLoading && <span className="section-value">Chargement des horaires (API)…</span>}
                          {!scheduleLoading && scheduleError && (
                            <span className="section-value">{scheduleError}</span>
                          )}
                          {!scheduleLoading && !scheduleError && groupedSchedule.length === 0 && (
                            <span className="section-value">Horaires non renseignés pour le moment.</span>
                          )}
                          {!scheduleLoading && !scheduleError && groupedSchedule.length > 0 && (
                            <div className="section-value">
                              {groupedSchedule.map((g) => (
                                <div key={g.day} style={{ marginBottom: '0.5rem' }}>
                                  <strong>{g.day}</strong>{' '}
                                  {g.items.map((s, idx) => (
                                    <span key={`${s.time}-${idx}`}>
                                      {idx === 0 ? '' : ' · '}
                                      {s.time}{s.level ? ` (${s.level})` : ''}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ marginTop: '0.75rem' }}>
                            <button className="btn btn-outline" onClick={() => navigate('/horaire')}>
                              Voir tout le planning
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="section-value">Horaires sur demande — contactez-nous.</span>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Section Équipement */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon equipment-icon">
                        <FontAwesomeIcon icon={faFistRaised} />
                      </div>
                      <h4>Équipement</h4>
                    </div>
                    <div className="section-content">
                      <span className="section-value">{info.meta?.equipment}</span>
                    </div>
                  </motion.div>
                  
                  {/* Section Tarif - Mise en évidence */}
                  <motion.div 
                    className="info-section price-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon price-icon">
                        <FontAwesomeIcon icon={faTrophy} />
                      </div>
                      <h4>Tarif</h4>
                    </div>
                    <div className="section-content">
                      {pricing ? (
                        <div className="price-display">
                          <span className="price-value">{formatPrice(pricing)}</span>
                          {pricing?.period ? <span className="price-period">/{pricing.period}</span> : null}
                        </div>
                      ) : (
                        <span className="section-value">Tarif sur demande</span>
                      )}
                    </div>
                  </motion.div>
                </div>
                
                {/* Bouton d'action */}
                <motion.div 
                  className="info-action"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <button className="btn btn-primary btn-full" onClick={() => navigate('/contact')}>
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>Nous contacter</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        </section>

      {/* CTA Section */}
      <section className="info-cta">
        <div className="container">
          <motion.div 
            className="cta-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2>Aller plus loin</h2>
            <p>Besoin d’un essai, d’un renseignement ou d’un conseil sur l’activité la plus adaptée ?</p>
          </motion.div>
          
          <div className="cta-grid">
            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <div className="cta-card-header">
                <motion.div 
                  className="cta-icon-container"
                  whileHover={{ 
                    rotate: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="cta-icon" />
                </motion.div>
                <h3>Nous contacter</h3>
              </div>
              <p>On vous répond rapidement et on vous oriente vers le bon créneau.</p>
              <motion.button 
                className="btn btn-primary" 
                onClick={() => navigate('/contact')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contactez-nous
              </motion.button>
            </motion.div>

            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <div className="cta-card-header">
                <motion.div 
                  className="cta-icon-container"
                  whileHover={{ 
                    rotate: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
                </motion.div>
                <h3>S'inscrire</h3>
              </div>
              <p>Consultez les tarifs et la liste des documents nécessaires.</p>
              <motion.button 
                className="btn btn-secondary" 
                onClick={() => navigate('/tarif')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                S'inscrire
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Liens visibles vers les autres pages Info */}
      <section className="content-section section-white info-related">
        <div className="container">
          <h2 className="section-title">Voir aussi</h2>
          <p className="home-section-subtitle">
            {info.kind === 'boxing'
              ? 'Toutes nos formes de pratique, du loisir à la compétition, en passant par l’inclusion.'
              : 'Les actions socio-éducatives du club : accompagnement, ateliers et sorties.'}
          </p>

          <div className="modern-grid grid-3">
            {allActivities
              .filter((p) => p.id !== info.id && p.kind === info.kind && p.enabled)
              .map((p) => {
                const pIcon = p.icon && iconMap[p.icon] ? iconMap[p.icon] : faFistRaised;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    className="modern-card info-related-card"
                    onClick={() => navigate(`/info/${p.id}`)}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="card-header" style={{ textAlign: 'center' }}>
                      <FontAwesomeIcon icon={pIcon} className="card-icon" />
                      <h3 style={{ margin: 0 }}>{p.title}</h3>
                    </div>
                    <div className="card-content">
                      <p style={{ margin: 0 }}>{p.subtitle}</p>
                    </div>
                    <div className="card-footer" style={{ textAlign: 'center' }}>
                      <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                        En savoir plus
                      </span>
                    </div>
                  </motion.button>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InfoPage;
