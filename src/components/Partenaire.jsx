import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faHandshake, faHeart, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';

import logoPoitiers from '../assets/LOGOPOITIERS.jpg';
import logoFFBoxe from '../assets/FFBOXE.png';
import logoEkidom from '../assets/ekidom.jpg';
import partenaireHero from '../assets/partenaire1.jpg';

const partenaires = [
  { 
    name: 'Ville de Poitiers', 
    logo: logoPoitiers, 
    link: 'https://poitiers.fr',
    description: 'Soutien institutionnel et mise à disposition d\'équipements sportifs',
    type: 'Institutionnel'
  },
  { 
    name: 'FFBOXE - Nouvelle Aquitaine', 
    logo: logoFFBoxe, 
    link: 'https://ffboxe.fr',
    description: 'Fédération Française de Boxe - Formation et compétitions officielles',
    type: 'Fédération'
  },
  { 
    name: 'Ekidom', 
    logo: logoEkidom, 
    link: 'https://www.ekidom.fr',
    description: 'Partenariat pour l\'accompagnement socio-éducatif des jeunes',
    type: 'Social'
  },
  { 
    name: 'Conseil Départemental de la Vienne', 
    logo: logoPoitiers, 
    link: '#',
    description: 'Soutien financier pour les projets d\'insertion par le sport',
    type: 'Institutionnel'
  },
  { 
    name: 'Région Nouvelle-Aquitaine', 
    logo: logoFFBoxe, 
    link: '#',
    description: 'Aide au développement des activités sportives et éducatives',
    type: 'Régional'
  },
  { 
    name: 'Association Sportive Locale', 
    logo: logoEkidom, 
    link: '#',
    description: 'Partenariat pour l\'organisation d\'événements sportifs',
    type: 'Sportif'
  }
];

const Partenaire = () => {
  const navigate = useNavigate();

  const getTypeColor = (type) => {
    switch (type) {
      case 'Institutionnel':
        return 'var(--primary-red)';
      case 'Fédération':
        return 'var(--primary-black)';
      case 'Social':
        return 'var(--primary-red-dark)';
      case 'Régional':
        return 'var(--primary-red)';
      case 'Sportif':
        return 'var(--primary-red-dark)';
      default:
        return 'var(--primary-red)';
    }
  };

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Partenaires"
        subtitle="Merci à ceux qui nous soutiennent et partagent nos valeurs sportives, humaines et inclusives."
        eyebrow="Confiance & engagement"
        image={partenaireHero}
        actions={[
          { label: "Devenir partenaire", to: "/contact", className: "btn-primary", icon: <FontAwesomeIcon icon={faHandshake} /> },
          { label: "Contact", to: "/contact", className: "btn-outline", icon: <FontAwesomeIcon icon={faEnvelope} /> },
        ]}
      />

      {/* Partners Section */}
      <section className="partners-main">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ils nous font confiance
          </motion.h2>
          
          <div className="partners-grid">
            {partenaires.map((partner, index) => (
              <motion.div
                key={index}
                className="partner-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="partner-logo">
                  <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
                  <div className="logo-overlay">
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </div>
                </div>
                
                <div className="partner-info">
                  <div className="partner-type" style={{ backgroundColor: getTypeColor(partner.type) }}>
                    {partner.type}
      </div>
                  <h3>{partner.name}</h3>
                  <p>{partner.description}</p>
                  
                  <a 
                    href={partner.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="partner-link"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                    Visiter le site
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="partners-values">
        <div className="container">
          <motion.div 
            className="values-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Nos Valeurs Partagées</h2>
            <div className="values-grid">
              <div className="value-item">
                <FontAwesomeIcon icon={faHandshake} className="value-icon" />
                <h3>Solidarité</h3>
                <p>Un réseau de partenaires engagés pour l'inclusion sociale</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faHeart} className="value-icon" />
                <h3>Engagement</h3>
                <p>Des partenaires qui partagent nos valeurs éducatives</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faExternalLinkAlt} className="value-icon" />
                <h3>Développement</h3>
                <p>Un soutien pour développer nos activités et projets</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="partners-cta">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Devenir Partenaire</h2>
            <p>Vous souhaitez nous soutenir et devenir partenaire de l'AF Boxing Club 86 ?</p>
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

export default Partenaire;

