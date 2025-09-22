import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarAlt, faUsers, faFistRaised, faGraduationCap, faHeart, faMusic, faBrain, faWheelchair } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const Horaire = () => {
  const schedule = [
    {
      day: 'Lundi',
      activities: [
        { time: '18h00-19h00', activity: 'Boxe Éducative', icon: faGraduationCap, level: '8-17 ans' },
        { time: '19h00-20h00', activity: 'Boxe Loisir', icon: faHeart, level: 'Tous niveaux' },
        { time: '20h00-21h00', activity: 'Boxe Amateur', icon: faFistRaised, level: 'Avancé' }
      ]
    },
    {
      day: 'Mardi',
      activities: [
        { time: '18h00-19h00', activity: 'Handiboxe', icon: faWheelchair, level: 'Adapté' },
        { time: '19h00-20h00', activity: 'Aeroboxe', icon: faMusic, level: 'Tous niveaux' },
        { time: '20h00-21h00', activity: 'Boxe Loisir', icon: faHeart, level: 'Tous niveaux' }
      ]
    },
    {
      day: 'Mercredi',
      activities: [
        { time: '18h00-19h00', activity: 'Boxe Éducative', icon: faGraduationCap, level: '8-17 ans' },
        { time: '19h00-20h00', activity: 'Boxe Thérapie', icon: faBrain, level: 'Thérapeutique' },
        { time: '20h00-21h00', activity: 'Boxe Amateur', icon: faFistRaised, level: 'Avancé' }
      ]
    },
    {
      day: 'Jeudi',
      activities: [
        { time: '18h00-19h00', activity: 'Boxe Loisir', icon: faHeart, level: 'Tous niveaux' },
        { time: '19h00-20h00', activity: 'Aeroboxe', icon: faMusic, level: 'Tous niveaux' },
        { time: '20h00-21h00', activity: 'Boxe Amateur', icon: faFistRaised, level: 'Avancé' }
      ]
    },
    {
      day: 'Vendredi',
      activities: [
        { time: '18h00-19h00', activity: 'Boxe Éducative', icon: faGraduationCap, level: '8-17 ans' },
        { time: '19h00-20h00', activity: 'Handiboxe', icon: faWheelchair, level: 'Adapté' },
        { time: '20h00-21h00', activity: 'Boxe Loisir', icon: faHeart, level: 'Tous niveaux' }
      ]
    },
    {
      day: 'Samedi',
      activities: [
        { time: '10h00-11h00', activity: 'Boxe Thérapie', icon: faBrain, level: 'Thérapeutique' },
        { time: '11h00-12h00', activity: 'Boxe Loisir', icon: faHeart, level: 'Tous niveaux' }
      ]
    }
  ];

  const getActivityColor = (activity) => {
    const colors = {
      'Boxe Éducative': 'var(--primary-red)',
      'Boxe Loisir': 'var(--primary-orange)',
      'Boxe Amateur': 'var(--primary-black)',
      'Handiboxe': 'var(--primary-red)',
      'Aeroboxe': 'var(--primary-orange)',
      'Boxe Thérapie': 'var(--primary-black)'
    };
    return colors[activity] || 'var(--primary-red)';
  };

  return (
    <div className="container-fluid">
      {/* Hero Section */}
      <section className="schedule-hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1>Horaires et Planning</h1>
            <p>Découvrez les créneaux d'entraînement pour chaque activité</p>
          </motion.div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="schedule-main">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Planning hebdomadaire
          </motion.h2>
          
          <div className="schedule-grid">
            {schedule.map((day, index) => (
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
                  {day.activities.map((activity, actIndex) => (
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
