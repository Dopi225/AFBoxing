import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faNewspaper, faMapMarkerAlt, faCalendarAlt, faClock, faCamera, faArrowRight, faEnvelope, faPlay } from '@fortawesome/free-solid-svg-icons';
// eslint-disable-next-line no-unused-vars -- motion.* utilisé dans le JSX (faux positif ESLint sur les namespaces)
import { motion } from 'framer-motion';
import PartnersLogos from './PartnersLogos';
import videaste from '../assets/club.mp4';
import posterImage from '../assets/club.jpeg';
import logo from '../assets/logo-removeb.png';
import { useNavigate } from 'react-router-dom';
import { newsApi, scheduleApi } from '../services/apiService';
// import educative from '../assets/s1.png';
// import loisir from '../assets/s2.png';
// import amateur from '../assets/s3.png';
// import handi from '../assets/s4.png';
// import aero from '../assets/gants.png';
import therapie from '../assets/p1.png';
import social from '../assets/social.jpg';

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
    day: 'numeric'
  });
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
  /** Vidéo lourde : uniquement après action utilisateur (pas de téléchargement MP4 au chargement). */
  const [videoRequested, setVideoRequested] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [latestNews, setLatestNews] = useState([]);
  const [newsError, setNewsError] = useState('');
  const [newsLoading, setNewsLoading] = useState(true);
  const [schedulePreview, setSchedulePreview] = useState({
    todayName: '',
    todaySessions: [],
    nextSessions: []
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const mapMountRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

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

  // Si la vidéo est demandée mais ne démarre pas, revenir au poster
  useEffect(() => {
    if (!videoRequested || showImageFallback) return;
    const videoTimeout = setTimeout(() => {
      if (!videoLoaded && !videoError) {
        setShowImageFallback(true);
      }
    }, 8000);
    return () => clearTimeout(videoTimeout);
  }, [videoRequested, videoLoaded, videoError, showImageFallback]);

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setShowImageFallback(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowImageFallback(true);
  };

  const canOfferVideo =
    !showImageFallback &&
    !isMobile &&
    !isSlowConnection &&
    !reducedMotion;

  const showHeroVideo = videoRequested && canOfferVideo;

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

  // Actualités + planning en parallèle (un seul double aller-retour réseau)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setNewsLoading(true);
      setScheduleLoading(true);
      setNewsError('');
      setScheduleError('');

      try {
        const [newsSettled, schedSettled] = await Promise.allSettled([newsApi.list(), scheduleApi.list()]);
        if (cancelled) return;

        if (newsSettled.status === 'rejected') {
          setNewsError('Impossible de charger les actualités pour le moment.');
          setLatestNews([]);
        } else {
          setNewsError('');
        }

        const newsItems = newsSettled.status === 'fulfilled' ? newsSettled.value : [];
        const list = Array.isArray(newsItems) ? newsItems : (newsItems?.data || []);
        const sorted = list
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        if (newsSettled.status === 'fulfilled') {
          setLatestNews(sorted);
        }

        if (schedSettled.status === 'rejected') {
          setScheduleError('Impossible de charger le planning pour le moment.');
        } else {
          setScheduleError('');
        }

        const scheduleItems = schedSettled.status === 'fulfilled' ? schedSettled.value : [];
        const sched = normalizeList(scheduleItems);
        const now = new Date();
        const todayName = FRENCH_DAYS[now.getDay()] || '';

        const todaySessions = sched
          .filter((s) => s?.day === todayName)
          .slice()
          .sort((a, b) => (parseStartMinutes(a?.time) ?? 9999) - (parseStartMinutes(b?.time) ?? 9999))
          .map((s) => ({
            day: s.day,
            time: s.time,
            activity: s.activity,
            level: s.level || ''
          }));

        const nextSessions = sched
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

        if (schedSettled.status === 'fulfilled') {
          setSchedulePreview({ todayName, todaySessions, nextSessions });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Erreur chargement accueil (news/schedule)', err);
        }
        if (!cancelled) {
          setNewsError('Impossible de charger les actualités pour le moment.');
          setScheduleError('Impossible de charger le planning pour le moment.');
          setLatestNews([]);
        }
      } finally {
        if (!cancelled) {
          setNewsLoading(false);
          setScheduleLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);
  
  return (
    <div className='container-fluid'>
      {/* Hero Section Moderne */}
      <section className="hero-section">
        {!showHeroVideo ? (
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
            autoPlay
            muted
            loop
            playsInline
            className="background-video"
            poster={posterImage}
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src={videaste} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}

        {canOfferVideo && !videoRequested && (
          <div className="hero-video-cta">
            <button
              type="button"
              className="hero-video-cta__btn"
              onClick={() => setVideoRequested(true)}
            >
              <FontAwesomeIcon icon={faPlay} aria-hidden />
              <span>Voir la vidéo d’ambiance</span>
            </button>
            <span className="hero-video-cta__hint">Optionnel — charge une vidéo HD</span>
          </div>
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
                <img
                  src={logo}
                  alt="AF Boxing Club 86"
                  width={500}
                  height={500}
                  decoding="async"
                  fetchPriority="high"
                />
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
          <h2 id="home-quicklinks-heading" className="section-title">Accès rapide</h2>
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

      {/* Dernières actualités (données API) */}
      <motion.section
        className="content-section section-white home-news-strip"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        aria-labelledby="home-news-heading"
      >
        <div className="container">
          <h2 id="home-news-heading" className="section-title">
            À la une
          </h2>
          <p className="home-news-strip__subtitle">
            Les dernières infos du club — rester informé des événements et annonces.
          </p>

          {newsLoading && (
            <div className="home-news-loading" role="status" aria-live="polite">
              <span className="afb-spinner" aria-hidden />
              <span>Chargement des actualités…</span>
            </div>
          )}

          {!newsLoading && newsError && (
            <div className="public-banner public-banner--warning" role="alert">
              {newsError}
            </div>
          )}

          {!newsLoading && !newsError && latestNews.length === 0 && (
            <p className="home-news-empty">
              Aucune actualité publiée pour le moment. Consultez bientôt cette section ou la page Actualités.
            </p>
          )}

          {!newsLoading && !newsError && latestNews.length > 0 && (
            <div className="home-news-grid">
              {latestNews.map((n) => (
                <article key={n.id} className="modern-card home-news-card">
                  <div className="home-news-card__date">
                    {formatDate(n.date || n.created_at)}
                  </div>
                  <h3 className="home-news-card__title">{n.title}</h3>
                  <p className="home-news-card__excerpt">
                    {(n.summary || '').length > 160 ? `${String(n.summary).slice(0, 160)}…` : n.summary}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className="home-news-strip__cta">
            <motion.button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/news')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FontAwesomeIcon icon={faNewspaper} />
              Toutes les actualités
            </motion.button>
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
              <img src={therapie} alt="Pôle Boxe" width={2000} height={2000} loading="lazy" decoding="async" />
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
              <img src={social} alt="Pôle socio-éducatif" width={4223} height={3167} loading="lazy" decoding="async" />
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
