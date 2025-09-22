
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faHeart, faTrophy, faUsers, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import coach1 from '../assets/squat.jpg';
import coach2 from '../assets/squat.jpg';

const equipeData = [
  {
    name: "Jean-Pierre Martin",
    role: "Coach Principal & Fondateur",
    description: "Fondateur du club, passionné de boxe anglaise depuis plus de 20 ans. Diplômé d'État en boxe anglaise et formateur d'éducateurs sportifs.",
    image: coach1,
    experience: "20+ ans d'expérience",
    speciality: "Boxe anglaise, formation des jeunes",
    certifications: ["DEJEPS Boxe Anglaise", "Formateur FFB"]
  },
  {
    name: "Marie Dubois",
    role: "Éducatrice Sportive",
    description: "Spécialiste de la condition physique et de l'encadrement des jeunes. Elle encadre les entraînements techniques et cardio avec passion.",
    image: coach2,
    experience: "8 ans d'expérience",
    speciality: "Préparation physique, boxe éducative",
    certifications: ["BPJEPS Activités Physiques", "Handiboxe"]
  },
  {
    name: "Ahmed Benali",
    role: "Éducateur Socio-sportif",
    description: "Éducateur spécialisé dans l'accompagnement socio-éducatif. Il coordonne les activités d'aide aux devoirs et d'orientation professionnelle.",
    image: coach1,
    experience: "12 ans d'expérience",
    speciality: "Accompagnement scolaire, insertion",
    certifications: ["DEES", "Médiateur social"]
  },
  {
    name: "Sophie Leroy",
    role: "Coordinatrice Handiboxe",
    description: "Spécialisée dans l'encadrement des personnes en situation de handicap. Elle développe des programmes adaptés pour l'inclusion par le sport.",
    image: coach2,
    experience: "6 ans d'expérience",
    speciality: "Handiboxe, sport adapté",
    certifications: ["CQP Handiboxe", "Formation sport adapté"]
  }
];

const Equipe = () => {
  const navigate = useNavigate();

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
              <FontAwesomeIcon icon={faUsers} className="hero-icon" />
            </motion.div>
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Notre Équipe
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Des professionnels passionnés et diplômés pour vous accompagner
            </motion.p>
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="badge-text">Équipe Qualifiée</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Team Section Moderne */}
      <section className="content-section">
        <div className="container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Rencontrez nos éducateurs
          </motion.h2>
          
          <div className="team-grid">
            {equipeData.map((member, index) => (
              <motion.div
                key={index}
                className="member-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="member-photo">
                  <img src={member.image} alt={member.name} />
                  <div className="photo-overlay">
                    <FontAwesomeIcon icon={faFistRaised} />
                  </div>
                </div>
                
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <h4>{member.role}</h4>
                  <p className="description">{member.description}</p>
                  
                  <div className="member-details">
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faTrophy} />
                      <span>{member.experience}</span>
                    </div>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faGraduationCap} />
                      <span>{member.speciality}</span>
                    </div>
                  </div>
                  
                  <div className="certifications">
                    <h5>Certifications :</h5>
                    <ul>
                      {member.certifications.map((cert, certIndex) => (
                        <li key={certIndex}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="team-values">
        <div className="container">
          <motion.div 
            className="values-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Nos Valeurs d'Équipe</h2>
            <div className="values-grid">
              <div className="value-item">
                <FontAwesomeIcon icon={faHeart} className="value-icon" />
                <h3>Passion</h3>
                <p>Une équipe passionnée par le sport et l'éducation</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faGraduationCap} className="value-icon" />
                <h3>Formation</h3>
                <p>Des éducateurs diplômés et en formation continue</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faUsers} className="value-icon" />
                <h3>Bienveillance</h3>
                <p>Un encadrement bienveillant et adapté à chacun</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="team-cta">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Rejoignez notre équipe</h2>
            <p>Vous souhaitez nous rejoindre ou devenir bénévole ? Contactez-nous !</p>
            <button className="btn btn-primary" onClick={() => navigate('/contact')}>
              <FontAwesomeIcon icon={faEnvelope} />
              Nous contacter
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Equipe;
