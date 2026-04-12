
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faHeart, faTrophy, faUsers, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';

import coach1 from '../assets/coach1.jpg';
import coach2 from '../assets/coach2.jpg';

const equipeData = [
  {
    name: "Encadrement boxe anglaise",
    role: "Coach principal",
    description: "Encadrement des séances (technique, sécurité, progression) et suivi des pratiquants du débutant au confirmé, dans le respect du cadre fédéral.",
    image: coach1,
    experience: "Encadrement diplômé",
    speciality: "Technique, progression, sécurité",
    certifications: ["Encadrement fédéral", "Formation continue"]
  },
  {
    name: "Encadrement jeunes",
    role: "Éducateur / éducatrice",
    description: "Organisation des groupes jeunes : apprentissage des bases, respect, confiance et progression, avec des contenus adaptés à l’âge et au niveau.",
    image: coach2,
    experience: "Suivi pédagogique",
    speciality: "Boxe éducative, motricité",
    certifications: ["Encadrement diplômé", "Prévention & sécurité"]
  },
  {
    name: "Accompagnement socio-éducatif",
    role: "Référent socio-éducatif",
    description: "Coordination des actions (aide aux devoirs, suivi, ateliers) et lien avec les familles pour un accompagnement concret et bienveillant.",
    image: coach1,
    experience: "Accompagnement",
    speciality: "Soutien scolaire, ateliers",
    certifications: ["Animation / médiation", "Coordination de projets"]
  },
  {
    name: "Inclusion & sport adapté",
    role: "Référent handiboxe",
    description: "Mise en place d’adaptations, progression individualisée et accueil de tous les publics, dans une logique d’inclusion par le sport.",
    image: coach2,
    experience: "Accompagnement adapté",
    speciality: "Handiboxe, inclusion",
    certifications: ["Formation sport adapté", "Sensibilisation handicap"]
  }
];

const Equipe = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid">
      <SectionHeader
        title="L’équipe"
        subtitle="Des professionnels passionnés (sport & socio-éducatif) pour vous accompagner avec exigence, bienveillance et sécurité."
        eyebrow="Encadrement qualifié"
        image={coach1}
        actions={[
          { label: "Activités", to: "/activite", className: "btn-primary", icon: <FontAwesomeIcon icon={faFistRaised} /> },
          { label: "Contact", to: "/contact", className: "btn-secondary", icon: <FontAwesomeIcon icon={faEnvelope} /> },
        ]}
      />

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
              >
                <div className="member-photo">
                  <img src={member.image} alt={member.name} loading="lazy" />
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
