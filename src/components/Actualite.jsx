import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faUsers, faLightbulb, faMapMarkerAlt, faHome, faEnvelope, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Actualite = () => {
  const navigate = useNavigate();

  const socialActivities = [
    {
      id: 'aide-devoirs',
      title: 'Aide aux devoirs',
      icon: faGraduationCap,
      description: 'Encadrement bienveillant pour soutenir les enfants dans leurs devoirs après l\'école.',
      details: 'Nos animateurs qualifiés accompagnent les enfants dans leurs devoirs dans un cadre bienveillant et structuré. L\'aide aux devoirs se déroule après l\'école pour permettre aux enfants de rentrer chez eux avec leurs devoirs terminés.',
      schedule: 'Lundi au Vendredi 16h30-18h00',
      age: '6-16 ans'
    },
    {
      id: 'accompagnement-scolaire',
      title: 'Accompagnement scolaire',
      icon: faUsers,
      description: 'Un suivi régulier avec des animateurs qualifiés pour progresser à l\'école.',
      details: 'Accompagnement personnalisé pour les enfants en difficulté scolaire. Nos éducateurs travaillent en collaboration avec les familles et les enseignants pour assurer un suivi cohérent.',
      schedule: 'Sur rendez-vous',
      age: '6-18 ans'
    },
    {
      id: 'orientation',
      title: 'Orientation professionnelle',
      icon: faLightbulb,
      description: 'Des ateliers pour aider les jeunes à s\'orienter dans leur parcours scolaire ou professionnel.',
      details: 'Ateliers d\'orientation et de découverte des métiers. Rencontres avec des professionnels, visites d\'entreprises et accompagnement dans les démarches d\'orientation.',
      schedule: 'Mercredi 14h-16h',
      age: '14-25 ans'
    },
    {
      id: 'sorties-pedagogiques',
      title: 'Sorties pédagogiques',
      icon: faMapMarkerAlt,
      description: 'Sorties culturelles et éducatives pour découvrir le monde autrement.',
      details: 'Visites de musées, parcs naturels, entreprises locales. Ces sorties permettent aux enfants de découvrir leur environnement et d\'enrichir leurs connaissances.',
      schedule: 'Pendant les vacances scolaires',
      age: '6-16 ans'
    },
    {
      id: 'sorties-familiales',
      title: 'Sorties familiales',
      icon: faHome,
      description: 'Moments de partage entre familles pour renforcer les liens et créer des souvenirs.',
      details: 'Sorties en famille pour favoriser les échanges et renforcer les liens familiaux. Pique-niques, visites, activités sportives en famille.',
      schedule: 'Un dimanche par mois',
      age: 'Toute la famille'
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
              <FontAwesomeIcon icon={faGraduationCap} className="hero-icon" />
            </motion.div>
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Programme Socio-éducatif
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Nos actions sociales et éducatives pour renforcer l'inclusion et la réussite de tous
            </motion.p>
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="badge-text">Éducation & Inclusion</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

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
              <p>Pour plus d'informations sur nos activités socio-éducatives.</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                Contactez-nous
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
              <p>Inscrivez votre enfant à nos activités socio-éducatives.</p>
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
