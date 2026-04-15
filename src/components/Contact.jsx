import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faPhoneAlt, faClock, faUser, faMessage, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faFacebookSquare, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';
import { contactsApi, scheduleApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import SectionHeader from './SectionHeader';

const Contact = () => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSettings();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      setScheduleLoading(true);
      setScheduleError('');
      try {
        const data = await scheduleApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setScheduleItems(list);
      } catch (err) {
        setScheduleError(err.message || "Impossible de charger le planning depuis l'API.");
        setScheduleItems([]);
      } finally {
        setScheduleLoading(false);
      }
    };
    load();
  }, []);

  const nextSessions = useMemo(() => {
    const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const items = (scheduleItems || []).slice().sort((a, b) => {
      const da = DAY_ORDER.indexOf(a?.day || '');
      const db = DAY_ORDER.indexOf(b?.day || '');
      if (da !== db) return da - db;
      return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
    return items.slice(0, 3);
  }, [scheduleItems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await contactsApi.submit({
        name: formData.username,
        email: formData.email,
        message: `${formData.message}\n\nTéléphone: ${formData.phone || 'Non renseigné'}`
      });
      setSuccess('Message envoyé ! Nous vous répondrons rapidement.');
      setFormData({ username: '', email: '', phone: '', message: '' });
    } catch (err) {
      // Gestion spécifique des erreurs
      if (err.status === 429) {
        setError('Trop de messages envoyés. Veuillez patienter avant de réessayer.');
      } else if (err.status === 422 && err.data?.errors) {
        // Erreurs de validation
        const errorMessages = Object.values(err.data.errors).join(', ');
        setError(`Erreur de validation : ${errorMessages}`);
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'envoi du message.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Contact"
        subtitle="Essai, inscription ou question : on vous répond rapidement. Retrouvez aussi l’adresse, les réseaux et un aperçu des prochains créneaux."
        eyebrow="Club & Association"
        actions={[
          { label: "Horaires", to: "/horaire", className: "btn-primary", icon: <FontAwesomeIcon icon={faClock} /> },
          { label: 'Tarifs et inscription', to: '/tarif', className: 'btn-secondary', icon: <FontAwesomeIcon icon={faPaperPlane} /> },
        ]}
      />

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
                    {settingsLoading ? (
                      <p className="public-inline-loading">
                        <span className="afb-spinner afb-spinner--sm" aria-hidden />
                        <span>Chargement…</span>
                      </p>
                    ) : (
                      <p>{settings.contact.address}</p>
                    )}
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
                    {settingsLoading ? (
                      <span className="public-inline-loading">
                        <span className="afb-spinner afb-spinner--sm" aria-hidden />
                        Chargement…
                      </span>
                    ) : (
                      <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}>{settings.contact.phone}</a>
                    )}
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
                    {settingsLoading ? (
                      <span className="public-inline-loading">
                        <span className="afb-spinner afb-spinner--sm" aria-hidden />
                        Chargement…
                      </span>
                    ) : (
                      <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
                    )}
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
                    <h4>Prochains créneaux</h4>
                    {scheduleLoading && (
                      <p className="public-inline-loading" role="status" aria-live="polite">
                        <span className="afb-spinner afb-spinner--sm" aria-hidden />
                        Chargement du planning…
                      </p>
                    )}
                    {!scheduleLoading && scheduleError && (
                      <div className="public-banner public-banner--warning" role="alert">
                        {scheduleError}
                      </div>
                    )}
                    {!scheduleLoading && !scheduleError && nextSessions.length === 0 && (
                      <p>Planning non renseigné pour le moment.</p>
                    )}
                    {!scheduleLoading && !scheduleError && nextSessions.length > 0 && (
                      <p>
                        {nextSessions.map((s, idx) => (
                          <span key={`${s.day}-${s.time}-${idx}`}>
                            {idx === 0 ? '' : <br />}
                            <strong>{s.day}</strong> — {s.time} — {s.activity}{s.level ? ` (${s.level})` : ''}
                          </span>
                        ))}
                      </p>
                    )}
                    <button type="button" className="btn btn-outline" onClick={() => navigate('/horaire')}>
                      Voir le planning complet
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  className="social-links"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <p className="contact-social-title">Suivez-nous</p>
                  <div className="social-icons">
                    {settingsLoading ? (
                      <p className="public-inline-loading">
                        <span className="afb-spinner afb-spinner--sm" aria-hidden />
                        Chargement des réseaux…
                      </p>
                    ) : (
                      <>
                        {settings.social.facebook && (
                          <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                            <FontAwesomeIcon icon={faFacebookSquare} />
                            <span>Facebook</span>
                          </a>
                        )}
                        {settings.social.instagram && (
                          <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                            <FontAwesomeIcon icon={faInstagram} />
                            <span>Instagram</span>
                          </a>
                        )}
                      </>
                    )}
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
                {error && (
                  <motion.p 
                    className="form-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p 
                    className="form-success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {success}
                  </motion.p>
                )}
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
                      placeholder="Nom et prénom (ex. Alex Dupont)"
                      required
                      disabled={submitting}
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
                      placeholder="Email (ex. alex.dupont@email.com)"
                      required
                      disabled={submitting}
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
                      placeholder="Téléphone (ex. 06 00 00 00 00)"
                      required
                      disabled={submitting}
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
                      placeholder="Votre message (ex. âge, activité souhaitée, disponibilité, question…)"
                      rows="5"
                      required
                      disabled={submitting}
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
                  whileHover={!submitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                  disabled={submitting}
                >
                  {!submitting && <FontAwesomeIcon icon={faPaperPlane} />}
                  {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
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
