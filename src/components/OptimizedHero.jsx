import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faUsers, faNewspaper, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import videaste from '../assets/club.mp4';
import posterImage from '../assets/club.jpeg';
import logo from '../assets/logo-removeb.png';
import { useNavigate } from 'react-router-dom';

const OptimizedHero = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Détecter la connexion lente
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    }
  }, []);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Afficher l'image si mobile ou connexion lente
  const shouldShowImage = isMobile || isSlowConnection;

  return (
    <section className="hero-section">
      {shouldShowImage ? (
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
          // On évite l'autoplay sur mobile ou connexion lente
          autoPlay={!(isMobile || isSlowConnection)} 
          muted 
          loop 
          playsInline 
          className="background-video"
          poster={posterImage}
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
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
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="hero-icon-container"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          >
            <div className="mil">
              <img src={logo} alt="AF Boxing Club 86" loading="lazy" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            AF Boxing Club 86
          </motion.h1>
          
          <motion.p 
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Votre club de boxe anglaise et d'accompagnement socio-éducatif à Poitiers
          </motion.p>
          
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <span className="badge-text">Sport • Éducation • Inclusion</span>
          </motion.div>

          <motion.div 
            className="btn-group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <button 
              className="btn btn-primary"
              onClick={() => handleNavigate('/activite')}
            >
              <FontAwesomeIcon icon={faFistRaised} />
              Découvrir nos activités
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => handleNavigate('/apropos')}
            >
              <FontAwesomeIcon icon={faUsers} />
              À propos du club
            </button>
            
            <button 
              className="btn btn-outline"
              onClick={() => handleNavigate('/contact')}
            >
              <FontAwesomeIcon icon={faNewspaper} />
              Nous contacter
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default OptimizedHero;
