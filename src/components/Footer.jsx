import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faEnvelope, faMapMarkerAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings } from '../hooks/useSettings';
import image2 from '../assets/logo-removeb.png';
import ThemeToggle from './ThemeToggle';
import './ThemeToggle.scss';

const Footer = () => {
  const { settings } = useSettings();
  const [showNav, setShowNav] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 778;

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
          <Link to="/" className="logo footer-logo-link" aria-label="Retour à l’accueil">
            <img src={image2} alt="" loading="lazy" />
          </Link>
          <p>Boxer pour mieux vivre ensemble à Poitiers.</p>
          <ThemeToggle />
        </motion.div>

        <motion.div
          className="footer-col"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h4 onClick={() => setShowNav(!showNav)} className="accordion-header">
            Plan du site {isMobile && (showNav ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />)}
          </h4>
          {(showNav || !isMobile) && (
            <ul>
              <li><Link to="/apropos">Le club</Link></li>
              <li><Link to="/activite">Activités</Link></li>
              <li><Link to="/horaire">Horaires</Link></li>
              <li><Link to="/galerie">Galerie</Link></li>
              <li><Link to="/news">Actualités</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/tarif">Tarifs et inscription</Link></li>
            </ul>
          )}
        </motion.div>

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
              <li>
                <FontAwesomeIcon icon={faPhoneAlt} />{' '}
                <a
                  href={`tel:${String(settings?.contact?.phone ?? '').replace(/\s/g, '')}`}
                >
                  {settings?.contact?.phone ?? '—'}
                </a>
              </li>
              <li>
                <FontAwesomeIcon icon={faEnvelope} />{' '}
                <a href={`mailto:${settings?.contact?.email ?? ''}`}>{settings?.contact?.email ?? '—'}</a>
              </li>
              <li>
                <FontAwesomeIcon icon={faMapMarkerAlt} /> {settings?.contact?.address ?? '—'}
              </li>
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
            {settings.social.facebook && (
              <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
            )}
            {settings.social.instagram && (
              <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            )}
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

