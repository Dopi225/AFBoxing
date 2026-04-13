import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faNewspaper, faMapMarkerAlt, faCalendarAlt, faClock, faCamera, faArrowRight, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import PartnersLogos from './PartnersLogos';
import videaste from '../assets/club.mp4';
import posterImage from '../assets/club.jpeg';
import logo from '../assets/logo-removeb.png';
import { useNavigate } from 'react-router-dom';
import { newsApi, scheduleApi } from '../services/apiService';
import educative from '../assets/s1.png';
import loisir from '../assets/s2.png';
import amateur from '../assets/s3.png';
import handi from '../assets/s4.png';
import aero from '../assets/gants.png';
import therapie from '../assets/p1.png';
import social from '../assets/social.jpg';

// Fix ESLint no-unused-vars dans certains setups: l'analyse ne voit pas `motion.*` en JSX.
// (variable inutilisée autorisée car commence par "_")
const _MOTION = motion;

export const CTAButton = ({ icon, label, onClick, delay = 0 }) => (
  <motion.a
    href="#"
    className="cta-btn"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    <FontAwesomeIcon icon={icon} className="icon" />
    {label}
  </motion.a>
);

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).toUpperCase();
};

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const normalizeList = (items) => (Array.isArray(items) ? items : (items?.data || []));

const parseStartMinutes = (timeRange) => {
  // Accepte : "18h00-19h00" / "18:00-19:00" / "18h-19h"
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
  if (diffDays === 0 && startMinutes <= nowMinutes) diffDays = 7; // créneau déjà passé aujourd'hui

  const date = new Date(now);
  date.setDate(now.getDate() + diffDays);
  date.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return date;
};

const AssociationDeBoxe = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const initialSlow = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const connection = navigator.connection;
    if (!connection) return false;
    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      (typeof connection.downlink === 'number' && connection.downlink < 1.5)
    );
  }, []);
  const [isSlowConnection, setIsSlowConnection] = useState(initialSlow);
  const [showImageFallback, setShowImageFallback] = useState(() => {
    const mobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    return mobile || initialSlow;
  });
  const [latestNews, setLatestNews] = useState([]);
  const [newsError, setNewsError] = useState('');
  const [schedulePreview, setSchedulePreview] = useState({
    todayName: '',
    todaySessions: [],
    nextSessions: []
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const mapMountRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activities, setActivities] = useState([]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Détecter la connexion lente
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const isSlow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.downlink < 1.5; // Moins de 1.5 Mbps
      setIsSlowConnection(isSlow);
      
      // Si connexion lente, afficher directement l'image
      if (isSlow) {
        setShowImageFallback(true);
      }
    }
  }, []);

  // Map: ne monter l'iframe que quand la section arrive dans le viewport (gros gain perf)
  useEffect(() => {
    if (!mapMountRef.current || mapReady) return;
    const el = mapMountRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setMapReady(true);
          observer.disconnect();
        }
      },
      { root: null, threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapReady]);

  // Timeout pour la vidéo (5 secondes max)
  useEffect(() => {
    const videoTimeout = setTimeout(() => {
      if (!videoLoaded && !videoError) {
        setShowImageFallback(true);
      }
    }, 5000); // 5 secondes

    return () => clearTimeout(videoTimeout);
  }, [videoLoaded, videoError]);

  // Évite de démarrer le téléchargement vidéo immédiatement (meilleure fluidité au 1er rendu)
  useEffect(() => {
    if (showImageFallback) {
      setShouldLoadVideo(false);
      return;
    }

    let cancelled = false;
    let idleId;
    let timerId;

    const enable = () => {
      if (!cancelled) setShouldLoadVideo(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 1500 });
    } else {
      timerId = setTimeout(enable, 800);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && idleId) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) clearTimeout(timerId);
    };
  }, [showImageFallback]);

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setShowImageFallback(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowImageFallback(true);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const quickLinks = [
    { title: 'Boxe', subtitle: 'Pratiques et niveaux', icon: faFistRaised, to: '/activite' },
    { title: 'Socio-éducatif', subtitle: 'Accompagnement', icon: faGraduationCap, to: '/actualite' },
    { title: 'Galerie', subtitle: 'Le club en images', icon: faCamera, to: '/galerie' },
    { title: 'Actualités', subtitle: 'Infos et événements', icon: faNewspaper, to: '/news' },
  ];

  // Charger les types de boxes depuis l'API (données dynamiques)
  // const loadActivities = async () => {
  //     try {
  //       const data = await activitiesApi.list();
        
  //       // Filtrer UNIQUEMENT les activités de boxe
  //       const boxingActivities = data
  //         .filter(a => a.kind === 'boxing' && a.enabled)
  //         .map(a => ({
  //           id: a.id,
  //           title: a.title,
  //           icon: a.icon && iconMap[a.icon] ? iconMap[a.icon] : faFistRaised,
  //           description: a.subtitle
  //         }));
  //         setActivities(boxingActivities);
  //     } catch (err) {
  //       setError(err.message || 'Impossible de charger les activités sportives.');
  //     }
  //   };
  // const boxingTypes = [
  //   { id: 'educative', title: 'Boxe éducative', desc: '8–17 ans • technique, valeurs, progression', image: educative, to: '/info/educative' },
  //   { id: 'loisir', title: 'Boxe loisir', desc: 'Tous âges • cardio, technique, plaisir', image: loisir, to: '/info/loisir' },
  //   { id: 'amateur', title: 'Boxe amateur', desc: 'Compétition • encadrement fédéral', image: amateur, to: '/info/amateur' },
  //   { id: 'handiboxe', title: 'Handiboxe', desc: 'Pratique inclusive • adaptée', image: handi, to: '/info/handiboxe' },
  //   { id: 'aeroboxe', title: 'Aéroboxe', desc: 'Sans contact • rythme & cardio', image: aero, to: '/info/aeroboxe' },
  //   { id: 'therapie', title: 'Boxe thérapie', desc: 'Bien-être • gestion du stress', image: therapie, to: '/info/therapie' },
  // ];

  // Charger les dernières actualités depuis l'API (données dynamiques)
  useEffect(() => {
    const loadNews = async () => {
      try {
        setNewsError('');
        const items = await newsApi.list();
        const list = Array.isArray(items) ? items : (items?.data || []);
        const sorted = list
          .slice() // copier pour ne pas muter la source
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        setLatestNews(sorted);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Erreur chargement actualités accueil', err);
        }
        setNewsError("Impossible de charger les actualités.");
      }
    };

    loadNews();
  }, []);

  // Aperçu planning : "Aujourd'hui" + "Prochains créneaux"
  useEffect(() => {
    const loadSchedulePreview = async () => {
      try {
        setScheduleError('');
        setScheduleLoading(true);

        const items = await scheduleApi.list();
        const list = normalizeList(items);

        const now = new Date();
        const todayName = FRENCH_DAYS[now.getDay()] || '';

        const todaySessions = list
          .filter((s) => s?.day === todayName)
          .slice()
          .sort((a, b) => (parseStartMinutes(a?.time) ?? 9999) - (parseStartMinutes(b?.time) ?? 9999))
          .map((s) => ({
            day: s.day,
            time: s.time,
            activity: s.activity,
            level: s.level || ''
          }));

        const nextSessions = list
          .map((s) => {
            const nextDate = buildNextOccurrence(s?.day, s?.time);
            if (!nextDate) return null;
            return {
              day: s.day,
              time: s.time,
              activity: s.activity,
              level: s.level || '',
              nextDate
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.nextDate - b.nextDate)
          .slice(0, 3);

        setSchedulePreview({ todayName, todaySessions, nextSessions });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Erreur chargement planning accueil', err);
        }
        setScheduleError("Impossible de charger le planning pour le moment.");
      } finally {
        setScheduleLoading(false);
      }
    };

    loadSchedulePreview();
  }, []);
  
  return (
    <div className='container-fluid'>
      {/* Hero Section Moderne */}
      <section className="hero-section">
        {showImageFallback || !shouldLoadVideo ? (
          <div 
            className="background-video mobile-fallback"
            style={{
              backgroundImage: `url(${posterImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ) : (
          <video 
            // Pas d'autoplay sur mobile ou connexion lente
            autoPlay={!(isMobile || isSlowConnection)} 
            muted 
            loop 
            playsInline 
            className="background-video"
            poster={posterImage}
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            controls={isMobile || isSlowConnection}
          >
            <source src={videaste} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}

        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div 
              className="hero-icon-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            >
              <motion.div 
                className="mil" 
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              > 
                <img src={logo} alt="AF Boxing Club 86" /> 
              </motion.div>
            </motion.div>
            
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <span className="hero-title__text">AF Boxing Club 86</span>
            </motion.h1>
            
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <span className="hero-description__text">« Boxer ensemble pour mieux vivre ensemble » — Poitiers.</span>
            </motion.p>
            
            {/* <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <span className="badge-text">Club de Boxe & Socio-éducatif</span>
            </motion.div> */}
 

            <motion.div 
              className="btn-group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.button 
                onClick={() => navigate('/apropos')} 
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faFistRaised} />
                Le Club
              </motion.button>
              <motion.button 
                onClick={() => navigate('/horaire')} 
                className="btn btn-outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
                Horaires
              </motion.button>
              <motion.button 
                onClick={() => navigate('/contact')} 
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faEnvelope} />
                Contact
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Accès rapide */}
      <motion.section
        className="content-section section-white home-quicklinks"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2 className="section-title">Accès rapide</h2>
          <p className="home-quicklinks-subtitle">
            Accédez rapidement aux infos clés : activités, socio-éducatif, galerie et vie du club.
          </p>

          <div className="modern-grid grid-4 home-quicklinks-grid">
            {quickLinks.map((item) => (
              <motion.button
                key={item.title}
                type="button"
                className="home-quicklink-card"
                onClick={() => handleNavigate(item.to)}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="home-quicklink-card__icon">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <div className="home-quicklink-card__title">{item.title}</div>
                <div className="home-quicklink-card__subtitle">{item.subtitle}</div>
                <div className="home-quicklink-card__arrow" aria-hidden="true">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pôle boxe */}
      <motion.section
        className="content-section section-white home-social"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="home-split">
            <div className="home-split__media">
              <img src={therapie} alt="Pôle Boxe" loading="lazy" />
            </div>
            <div className="home-split__content">
              <div className="home-eyebrow">Pôle Boxe</div>
              <h2 className="home-split__title">Un club de boxe pour tous les niveaux</h2>
              <p className="home-split__text">
                Boxe éducative, boxe loisir, boxe compétition, etc...  
          Un encadrement structuré pour progresser, se dépasser et performer,
          quel que soit votre niveau.
              </p>
              <ul className="home-bullets">
                <li>Boxe anglaise & disciplines associées</li>
                <li>Entraînements techniques et physiques</li>
                <li>Préparation aux compétitions officielles</li>
              </ul>
              <div className="home-split__actions">
                <button className="btn btn-primary" onClick={() => handleNavigate('/activite')}>
                  <FontAwesomeIcon icon={faFistRaised} />
                  Découvrir le pôle boxe
                </button>
                <button className="btn btn-outline" onClick={() => handleNavigate('/contact')}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  Nous contacter
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pôle socio-éducatif */}
      <motion.section
        className="content-section section-white home-social"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="home-split">
            <div className="home-split__media">
              <img src={social} alt="Pôle socio-éducatif" loading="lazy" />
            </div>
            <div className="home-split__content">
              <div className="home-eyebrow">Pôle socio-éducatif</div>
              <h2 className="home-split__title">  Le sport comme outil d’éducation et d’insertion</h2>
              <p className="home-split__text">
                À travers la boxe et des actions éducatives ciblées, nous accompagnons
          les jeunes et les familles dans leur parcours scolaire, social et
          citoyen, en transmettant des valeurs de respect, discipline et engagement.
              </p>
              <ul className="home-bullets">
                <li>Accompagnement scolaire et aide aux devoirs</li>
                <li>Ateliers éducatifs et citoyens</li>
                <li>Actions de prévention et d’insertion</li>
              </ul>
              <div className="home-split__actions">
                <button className="btn btn-primary" onClick={() => handleNavigate('/actualite')}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                  Découvrir le socio-éducatif
                </button>
                <button className="btn btn-outline" onClick={() => handleNavigate('/contact')}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  Nous contacter
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section Partenaires */}
      <section className="content-section section-white">
        <div className="container">
          <PartnersLogos />
        </div>
      </section>

      {/* Planning en un coup d'œil */}
      <motion.section
        className="content-section section-white home-schedule-overview"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Planning en un coup d’œil
          </motion.h2>

          <p className="home-schedule-subtitle">
            Tout est visible rapidement : aujourd’hui, puis les prochains créneaux.
          </p>

          {scheduleError && (
            <div className="home-schedule-alert" role="status">
              {scheduleError}
            </div>
          )}

          <div className="home-schedule-grid">
            <div className="modern-card home-schedule-card" aria-labelledby="home-schedule-today">
              <div className="home-schedule-card__header">
                <div className="home-schedule-card__title" id="home-schedule-today">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Aujourd’hui {schedulePreview.todayName ? `(${schedulePreview.todayName})` : ''}</span>
                </div>
              </div>

              {scheduleLoading && (
                <div className="home-schedule-skeleton" aria-hidden="true">
                  <div className="line" />
                  <div className="line" />
                  <div className="line" />
                </div>
              )}

              {!scheduleLoading && !scheduleError && (
                <div className="home-schedule-list">
                  {schedulePreview.todaySessions.length === 0 ? (
                    <p className="home-schedule-empty">Aucun créneau aujourd’hui.</p>
                  ) : (
                    schedulePreview.todaySessions.map((s, idx) => (
                      <div className="home-schedule-item" key={`${s.time}-${s.activity}-${idx}`}>
                        <div className="home-schedule-time">
                          <FontAwesomeIcon icon={faClock} />
                          <span>{s.time}</span>
                        </div>
                        <div className="home-schedule-meta">
                          <div className="home-schedule-activity">{s.activity}</div>
                          {s.level ? <div className="home-schedule-level">{s.level}</div> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="modern-card home-schedule-card" aria-labelledby="home-schedule-next">
              <div className="home-schedule-card__header">
                <div className="home-schedule-card__title" id="home-schedule-next">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Prochains créneaux</span>
                </div>
              </div>

              {scheduleLoading && (
                <div className="home-schedule-skeleton" aria-hidden="true">
                  <div className="line" />
                  <div className="line" />
                  <div className="line" />
                </div>
              )}

              {!scheduleLoading && !scheduleError && (
                <div className="home-schedule-list">
                  {schedulePreview.nextSessions.length === 0 ? (
                    <p className="home-schedule-empty">Planning non renseigné pour le moment.</p>
                  ) : (
                    schedulePreview.nextSessions.map((s, idx) => (
                      <div className="home-schedule-item" key={`${s.day}-${s.time}-${s.activity}-${idx}`}>
                        <div className="home-schedule-time">
                          <span className="home-schedule-day">{s.day}</span>
                          <span>{s.time}</span>
                        </div>
                        <div className="home-schedule-meta">
                          <div className="home-schedule-activity">{s.activity}</div>
                          {s.level ? <div className="home-schedule-level">{s.level}</div> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="home-schedule-cta">
            <motion.button
              className="btn btn-primary"
              onClick={() => navigate('/horaire')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
              Voir tout le planning
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Section Carte */}
      <motion.section 
        className="content-section section-dark"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Où nous trouver ?
          </motion.h2>
          
          <motion.div
            ref={mapMountRef}
            className="map-container"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {mapReady ? (
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2741.968787766348!2d0.3724682999999999!3d46.5878544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47fdbf8354a062bd%3A0x3083448a662d0747!2sAF%20BOXING%20CLUB%2086%20-%20Salle%20Nelson%20Mandela!5e0!3m2!1sfr!2sfr!4v1753109311699!5m2!1sfr!2sfr"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '20px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AF Boxing Club 86"
              />
            ) : (
              <div style={{ height: 400, borderRadius: 20, background: 'rgba(255,255,255,0.06)' }} />
            )}
          </motion.div>
        </div>
      </motion.section>
    
    </div>
  );
};

export default AssociationDeBoxe;
