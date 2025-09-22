import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faEnvelope, faMapMarkerAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import image2 from '../assets/logo-removeb.png';

const Footer = () => {
  const [showNav, setShowNav] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const navigate = useNavigate();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 778;

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <motion.div 
          className="footer-col brand"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className='logo' onClick={() => handleNavigate('/')}>
            <img src={image2} alt="AF Boxing Club 86" />
          </div>
          <p>Boxer pour mieux vivre ensemble à Poitiers.</p>
        </motion.div>

        {/* Navigation */}
        <motion.div 
          className="footer-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h4 onClick={() => setShowNav(!showNav)} className="accordion-header">
            Navigation {isMobile && (showNav ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />)}
          </h4>
          {(showNav || !isMobile) && (
            <ul>
              <li><a onClick={() => handleNavigate('/apropos')}>À propos</a></li>
              <li><a onClick={() => handleNavigate('/activite')}>Activités</a></li>
              <li><a onClick={() => handleNavigate('/actualite')}>Socio-éducatif</a></li>
              <li><a onClick={() => handleNavigate('/equipe')}>Équipe</a></li>
              <li><a onClick={() => handleNavigate('/horaire')}>Horaires</a></li>
              <li><a onClick={() => handleNavigate('/galerie')}>Galerie</a></li>
              <li><a onClick={() => handleNavigate('/palmares')}>Palmarès</a></li>
              <li><a onClick={() => handleNavigate('/partenaire')}>Partenaires</a></li>
              <li><a onClick={() => handleNavigate('/contact')}>Contact</a></li>
              <li><a onClick={() => handleNavigate('/tarif')}>Tarifs</a></li>
            </ul>
          )}
        </motion.div>

        {/* Activités */}
        <motion.div 
          className="footer-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h4>Nos Activités</h4>
          <ul>
            <li><a onClick={() => handleNavigate('/info/educative')}>Boxe Éducative</a></li>
            <li><a onClick={() => handleNavigate('/info/loisir')}>Boxe Loisir</a></li>
            <li><a onClick={() => handleNavigate('/info/amateur')}>Boxe Amateur</a></li>
            <li><a onClick={() => handleNavigate('/info/handiboxe')}>Handiboxe</a></li>
            <li><a onClick={() => handleNavigate('/info/aeroboxe')}>Aeroboxe</a></li>
            <li><a onClick={() => handleNavigate('/info/therapie')}>Boxe Thérapie</a></li>
          </ul>
        </motion.div>

        {/* Contact */}
        <motion.div 
          className="footer-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h4 onClick={() => setShowContact(!showContact)} className="accordion-header">
            Contact {isMobile && (showContact ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />)}
          </h4>
          {(showContact || !isMobile) && (
            <ul>
              <li><FontAwesomeIcon icon={faPhoneAlt} /> <a href="tel:0637232698">06 37 23 26 98</a></li>
              <li><FontAwesomeIcon icon={faEnvelope} /> <a href="mailto:afboxingclub86@gmail.com">afboxingclub86@gmail.com</a></li>
              <li><FontAwesomeIcon icon={faMapMarkerAlt} /> 2 rue Gabriel Morain, 86000 Poitiers</li>
            </ul>
          )}
        </motion.div>

        {/* Réseaux sociaux */}
        <motion.div 
          className="footer-col social"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h4>Suivez-nous</h4>
          <div className="social-icons">
            <a href="https://www.facebook.com/afboxingclub86" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a href="https://www.instagram.com/afboxingclub86" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
        </motion.div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} AF Boxing Club 86 – Tous droits réservés</p>
      </div>
    </footer>
  );
};

export default Footer;

