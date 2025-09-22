import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faUsers, faNewspaper, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Partenaire from './Partenaire';
import videaste from '../assets/club.mp4';
import posterImage from '../assets/club.jpeg';
import logo from '../assets/logo-removeb.png';
import { useNavigate } from 'react-router-dom';
import newsItems from '../donnee/newsData';

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

const AssociationDeBoxe = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showImageFallback, setShowImageFallback] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

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

  // Timeout pour la vidéo (5 secondes max)
  useEffect(() => {
    const videoTimeout = setTimeout(() => {
      if (!videoLoaded && !videoError) {
        console.log('Video loading timeout - switching to image fallback');
        setShowImageFallback(true);
      }
    }, 5000); // 5 secondes

    return () => clearTimeout(videoTimeout);
  }, [videoLoaded, videoError]);

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

  const latestNews = [...newsItems]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  
  return (
    <div className='container-fluid'>
      {/* Hero Section Moderne */}
      <section className="hero-section">
        {showImageFallback ? (
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
            onLoadStart={() => console.log('Video loading started')}
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
              AF Boxing Club 86
            </motion.h1>
            
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              "Boxer ensemble pour mieux vivre ensemble"
            </motion.p>
            
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <span className="badge-text">Club de Boxe & Socio-éducatif</span>
            </motion.div>

            <motion.div 
              className="btn-group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.button 
                onClick={() => navigate('/activite')} 
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faFistRaised} />
                Boxe Anglaise
              </motion.button>
              <motion.button 
                onClick={() => navigate('/actualite')} 
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faGraduationCap} />
                Socio-éducatif
              </motion.button>
              <motion.button 
                onClick={() => navigate('/apropos')} 
                className="btn btn-outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faUsers} />
                Qui sommes-nous ?
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section Actualités Moderne */}
      <motion.section 
        className="content-section"
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
            Nos Actualités
          </motion.h2>
          
          <div className="modern-grid grid-3">
            {latestNews.map((item, index) => (
              <motion.div 
                className="modern-card news-card" 
                onClick={() => handleNavigate('/news')} 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="news-image">
                  <img src={item.image} alt={item.title} />
                  <div className="news-overlay">
                    <FontAwesomeIcon icon={faNewspaper} />
                  </div>
                </div>
                <div className="news-content">
                  <span className="news-date">{formatDate(item.date)}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center" style={{ marginTop: '3rem' }}>
            <motion.button 
              onClick={() => handleNavigate('/news')} 
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faNewspaper} />
              Voir toutes les actualités
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Section Partenaires */}
      <section className="content-section section-white">
        <div className="container">
          <Partenaire/>
        </div>
      </section>

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
            className="map-container"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2741.968787766348!2d0.3724682999999999!3d46.5878544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47fdbf8354a062bd%3A0x3083448a662d0747!2sAF%20BOXING%20CLUB%2086%20-%20Salle%20Nelson%20Mandela!5e0!3m2!1sfr!2sfr!4v1753109311699!5m2!1sfr!2sfr"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '20px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="AF Boxing Club 86"
            ></iframe>
          </motion.div>
        </div>
      </motion.section>
    
    </div>
  );
};

export default AssociationDeBoxe;
