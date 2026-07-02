import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faHandshake, faHeart, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';
import { PARTNERS } from '../data/partners';
import '../style/Partenaire.scss';

const TYPE_CLASS = {
  Institutionnel: 'partner-type--institutionnel',
  Federation: 'partner-type--federation',
  Social: 'partner-type--social',
};

const Partenaire = () => {
  const navigate = useNavigate();

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Partenaires"
        subtitle="Merci à ceux qui nous soutiennent et partagent nos valeurs sportives, humaines et inclusives."
        eyebrow="Confiance & engagement"
        actions={[
          { label: 'Devenir partenaire', to: '/contact', className: 'btn-primary', icon: <FontAwesomeIcon icon={faHandshake} /> },
          { label: 'Contact', to: '/contact', className: 'btn-outline', icon: <FontAwesomeIcon icon={faEnvelope} /> },
        ]}
      />

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

          <div className="partners-grid partners-grid--compact">
            {PARTNERS.map((partner, index) => (
              <motion.div
                key={partner.id}
                className="partner-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="partner-logo">
                  <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
                  <div className="logo-overlay">
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </div>
                </div>

                <div className="partner-info">
                  <div className={`partner-type ${TYPE_CLASS[partner.type] || 'partner-type--institutionnel'}`}>
                    {partner.type === 'Federation' ? 'Fédération' : partner.type}
                  </div>
                  <h3>{partner.name}</h3>
                  <p>{partner.description}</p>

                  <a
                    href={partner.href}
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
            <button type="button" className="btn btn-primary" onClick={() => navigate('/contact')}>
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
