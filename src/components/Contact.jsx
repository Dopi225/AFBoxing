import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faPhoneAlt, faClock, faUser, faMessage, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faFacebookSquare, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici logique d'envoi ou traitement
    console.log(formData);
    alert('Message envoyé ! Nous vous répondrons rapidement.');
    setFormData({ username: '', email: '', phone: '', message: '' });
  };

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
              <FontAwesomeIcon icon={faEnvelope} className="hero-icon" />
            </motion.div>
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Contactez-nous
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Que ce soit pour un essai, une inscription ou toute question, nous sommes à votre écoute.
            </motion.p>
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="badge-text">Nous répondons rapidement</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="content-section" id="contact">

        <div className="container">
          <div className="modern-grid grid-2">
            {/* Informations de contact */}
            <motion.div 
              className="modern-card contact-info-card"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="card-icon" />
                <h3>Nos coordonnées</h3>
              </div>
              
              <div className="contact-items">
                <motion.div 
                  className="contact-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                  <div>
                    <h4>Adresse</h4>
                    <p>2 rue Gabriel Morain<br />86000 Poitiers</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="contact-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <FontAwesomeIcon icon={faPhoneAlt} className="contact-icon" />
                  <div>
                    <h4>Téléphone</h4>
                    <a href="tel:0637232698">06 37 23 26 98</a>
                  </div>
                </motion.div>

                <motion.div 
                  className="contact-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:afboxingclub86@gmail.com">afboxingclub86@gmail.com</a>
                  </div>
                </motion.div>

                <motion.div 
                  className="contact-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <FontAwesomeIcon icon={faClock} className="contact-icon" />
                  <div>
                    <h4>Horaires</h4>
                    <p>Lun-Ven: 18h-21h<br />Sam: 10h-12h</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="social-links"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h4>Suivez-nous</h4>
                  <div className="social-icons">
                    <a href="https://www.facebook.com/afboxingclub86" target="_blank" rel="noopener noreferrer" className="social-link">
                      <FontAwesomeIcon icon={faFacebookSquare} />
                      <span>Facebook</span>
                    </a>
                    <a href="https://www.instagram.com/afboxingclub86" target="_blank" rel="noopener noreferrer" className="social-link">
                      <FontAwesomeIcon icon={faInstagram} />
                      <span>Instagram</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Formulaire de contact */}
            <motion.div 
              className="modern-card contact-form-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faMessage} className="card-icon" />
                <h3>Envoyez-nous un message</h3>
              </div>
              
              <form className="contact-form" onSubmit={handleSubmit}>
                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="input-container">
                    <FontAwesomeIcon icon={faUser} className="input-icon" />
                    <input
                      type="text"
                      name="username"
                      className="form-input"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="input-container">
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Votre email"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="input-container">
                    <FontAwesomeIcon icon={faPhoneAlt} className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Votre téléphone"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="form-group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="input-container">
                    <FontAwesomeIcon icon={faMessage} className="input-icon" />
                    <textarea
                      name="message"
                      className="form-input form-textarea"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Votre message"
                      rows="5"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button 
                  type="submit" 
                  className="btn btn-primary form-submit"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Envoyer le message
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Section Carte */}
        <section className="content-section section-dark">
          <div className="container">
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Où nous trouver ?
            </motion.h2>
            
            <motion.div 
              className="map-container"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2741.968787766348!2d0.3724682999999999!3d46.5878544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47fdbf8354a062bd%3A0x3083448a662d0747!2sAF%20BOXING%20CLUB%2086%20-%20Salle%20Nelson%20Mandela!5e0!3m2!1sfr!2sfr!4v1753109311699!5m2!1sfr!2sfr"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '20px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AF Boxing Club 86"
              />
            </motion.div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default Contact;
