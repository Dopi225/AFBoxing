import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faUsers, faHeart, faTrophy, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';

// Fix ESLint no-unused-vars dans certains setups: l'analyse ne voit pas `motion.*` en JSX.
// (variable inutilisée autorisée car commence par "_")
const _MOTION = motion;


const Apropos = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Le club"
        subtitle="Une structure sportive et socio-éducative à Poitiers, fondée sur le respect, la discipline et la solidarité."
        eyebrow="Sport • Éducation • Inclusion"
        actions={[
          { label: "Activités", to: "/activite", className: "btn-primary", icon: <FontAwesomeIcon icon={faFistRaised} /> },
          { label: "Socio-éducatif", to: "/actualite", className: "btn-outline", icon: <FontAwesomeIcon icon={faGraduationCap} /> },
          { label: "Contact", to: "/contact", className: "btn-secondary", icon: <FontAwesomeIcon icon={faUsers} /> },
        ]}
      />

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <motion.div 
            className="mission-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Notre Mission</h2>
            <p className="mission-text">
              L'AF Boxing Club 86 est un club de boxe anglaise et d'accompagnement socio-éducatif situé à Poitiers (86), dans la Vienne. 
              Fondé sur des valeurs de respect, de discipline et de solidarité, notre structure a pour mission de promouvoir le sport pour tous.
            </p>
            <div className="mission-quote">
              <blockquote>"Boxer ensemble pour mieux vivre ensemble"</blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="container">
          <h2>Nos Valeurs</h2>
          <div className="values-grid">
            <motion.div 
              className="value-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faFistRaised} className="value-icon" />
              <h3>Respect</h3>
              <p>Respect de soi, des autres et des règles. La boxe nous enseigne l'humilité et la discipline.</p>
            </motion.div>

            <motion.div 
              className="value-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faGraduationCap} className="value-icon" />
              <h3>Éducation</h3>
              <p>Le sport comme outil d'éducation et d'épanouissement personnel pour tous les âges.</p>
            </motion.div>

            <motion.div 
              className="value-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faHandshake} className="value-icon" />
              <h3>Solidarité</h3>
              <p>Un esprit d'équipe et d'entraide qui dépasse le cadre sportif pour créer du lien social.</p>
            </motion.div>

            <motion.div 
              className="value-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faHeart} className="value-icon" />
              <h3>Inclusion</h3>
              <p>Un club ouvert à tous, sans discrimination, où chacun trouve sa place et peut s'épanouir.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="activities-section">
        <div className="container">
          <h2>Nos Activités</h2>
          <div className="activities-grid">
            <motion.div 
              className="activity-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <FontAwesomeIcon icon={faFistRaised} className="activity-icon" />
              <h3>Boxe Anglaise</h3>
              <p>Pratique de la boxe anglaise pour tous les niveaux : éducative, loisir, amateur et handiboxe.</p>
              <button className="btn btn-primary" onClick={() => navigate('/activite')}>
                Découvrir
              </button>
            </motion.div>

            <motion.div 
              className="activity-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <FontAwesomeIcon icon={faGraduationCap} className="activity-icon" />
              <h3>Programme Socio-éducatif</h3>
              <p>Accompagnement scolaire, aide aux devoirs et sorties pédagogiques pour les familles.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/actualite')}>
                En savoir plus
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <motion.div 
            className="team-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Notre Équipe</h2>
            <p>
              Une équipe d'éducateurs diplômés et passionnés, engagés dans la transmission des valeurs 
              du sport et l'accompagnement de nos membres vers l'épanouissement personnel.
            </p>
            <button className="btn btn-outline" onClick={() => navigate('/equipe')}>
              Rencontrer l'équipe
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-grid">
            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faTrophy} className="cta-icon" />
              <h3>Palmarès</h3>
              <p>Résultats, moments marquants et compétitions : l’histoire du club en chiffres.</p>
              <button className="btn btn-primary" onClick={() => navigate('/palmares')}>
                Voir le palmarès
              </button>
            </motion.div>

            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faUsers} className="cta-icon" />
              <h3>Commencer au club</h3>
              <p>Tarifs, inscription et documents : tout est prêt pour démarrer sereinement.</p>
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

export default Apropos;
