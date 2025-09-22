import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faHeart, faMusic, faBrain, faWheelchair, faCalendarAlt, faTrophy, faClock, faUsers } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const Activite = () => {
  const navigate = useNavigate(); 

  const activities = [
    {
      id: 'educative',
      title: 'Boxe Éducative',
      icon: faGraduationCap,
      description: 'Adaptée aux jeunes de 8 à 17 ans, axée sur la technique sans contact, apprentissage et valeurs citoyennes.',
      age: '8-17 ans',
      level: 'Débutant',
      color: 'var(--primary-red)'
    },
    {
      id: 'loisir',
      title: 'Boxe Loisir',
      icon: faHeart,
      description: 'Pour tous âges, entraînement sans compétition, plaisir du sport, cardio et technique.',
      age: 'Tous âges',
      level: 'Tous niveaux',
      color: 'var(--primary-orange)'
    },
    {
      id: 'amateur',
      title: 'Boxe Amateur',
      icon: faFistRaised,
      description: 'Pour les plus engagés, participation aux compétitions officielles encadrées par la FFB.',
      age: '16+ ans',
      level: 'Avancé',
      color: 'var(--primary-black)'
    },
    {
      id: 'handiboxe',
      title: 'Handiboxe',
      icon: faWheelchair,
      description: 'Adaptée aux personnes en situation de handicap. Une pratique inclusive et dynamique.',
      age: 'Tous âges',
      level: 'Adapté',
      color: 'var(--primary-red)'
    },
    {
      id: 'aeroboxe',
      title: 'Aeroboxe',
      icon: faMusic,
      description: 'Boxe sans contact avec musique, pour travailler le cardio, la coordination et le rythme.',
      age: 'Tous âges',
      level: 'Tous niveaux',
      color: 'var(--primary-orange)'
    },
    {
      id: 'therapie',
      title: 'Boxe Thérapie',
      icon: faBrain,
      description: 'Utilisation de la boxe dans une démarche de bien-être mental, gestion du stress et résilience.',
      age: 'Tous âges',
      level: 'Thérapeutique',
      color: 'var(--primary-black)'
    }
  ];

  return (
    <div className="container-fluid">
      {/* Hero Section Moderne */}
      <section className="hero-section">
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
              <FontAwesomeIcon icon={faFistRaised} className="hero-icon" />
            </motion.div>
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Nos Activités
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Découvrez toutes les formes de pratique de la boxe proposées par l'AF Boxing Club 86
            </motion.p>
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="badge-text">Boxe & Éducation</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

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

      {/* Schedule Section Moderne */}
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
          
          <div className="modern-grid grid-2">
            <motion.div 
              className="modern-card schedule-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faClock} className="card-icon" />
                <h3>Lundi - Vendredi</h3>
              </div>
              <div className="card-content">
                <p>18h00 - 21h00</p>
                <p>Entraînements pour tous les niveaux</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="modern-card schedule-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faClock} className="card-icon" />
                <h3>Samedi</h3>
              </div>
              <div className="card-content">
                <p>10h00 - 12h00</p>
                <p>Séances spéciales et compétitions</p>
              </div>
            </motion.div>
          </div>
          
          <div className="text-center" style={{ marginTop: '3rem' }}>
            <motion.button 
              className="btn btn-primary"
              onClick={() => navigate('/horaire')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FontAwesomeIcon icon={faCalendarAlt} />
              Voir le planning complet
            </motion.button>
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
              <p>Découvrez les succès de nos boxeurs en compétition.</p>
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
