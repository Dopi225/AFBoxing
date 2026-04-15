import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faFileAlt, faDownload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import { pricingApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
const formatPrice = (price) => {
  if (!price) return '—';
  if (price.amount === 0) return 'Gratuit';
  if (typeof price.amount === 'number') return `${price.amount}€`;
  return String(price.amount);
};

const Tarif = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingStale, setPricingStale] = useState(false);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [modalOpen]);

  useEffect(() => {
    const fallbackPricing = {
      boxing: {
        educative: { label: 'Boxe Éducative', amount: 80, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' },
        loisir: { label: 'Boxe Loisir', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' }
      },
      social: {
        periscolaire: { label: 'Programme Social-Éducatif', amount: 30, period: 'an', note: 'Tarif dégressif selon quotient familial (CAF)' }
      }
    };

    const loadPricing = async () => {
      setPricingLoading(true);
      setPricingStale(false);
      try {
        const data = await pricingApi.list();
        setPricing(data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Error loading pricing:', err);
        }
        setPricing(fallbackPricing);
        setPricingStale(true);
      } finally {
        setPricingLoading(false);
      }
    };

    loadPricing();
  }, []);

  const openModal = (type) => {
    if (!pricing) return;
    
    const boxingEduc = pricing.boxing?.educative || { label: 'Boxe Éducative', amount: 80, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' };
    const boxingAdult = pricing.boxing?.loisir || pricing.boxing?.amateur || { label: 'Boxe Loisir', amount: 120, period: 'an', note: 'Licence comprise – Certificat médical obligatoire' };
    const social = pricing.social?.periscolaire || { label: 'Programme Social-Éducatif', amount: 30, period: 'an', note: 'Tarif dégressif selon quotient familial (CAF)' };

    if (type === 'boxe') {
      setModalTitle("Inscription Boxe Anglaise");
      setModalContent(
        <div className="modal-content">
          <div className="pricing-section">
            <h3><FontAwesomeIcon icon={faFistRaised} /> Tarifs</h3>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h4>Boxe Éducative</h4>
                <div className="price">{formatPrice(boxingEduc)}<span>/{boxingEduc.period}</span></div>
                <p>Enfants et adolescents (-18 ans)</p>
              </div>
              <div className="pricing-card featured">
                <h4>Boxe Loisir/Amateur</h4>
                <div className="price">{formatPrice(boxingAdult)}<span>/{boxingAdult.period}</span></div>
                <p>Adultes (18 ans et plus)</p>
              </div>
            </div>
            <div className="pricing-note">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>{boxingEduc.note}</span>
            </div>
          </div>

          <div className="documents-section">
            <h3><FontAwesomeIcon icon={faFileAlt} /> Documents à fournir</h3>
            <div className="documents-list">
              <a href="/docs/reglement-boxe.pdf" download className="document-link">
                <FontAwesomeIcon icon={faDownload} />
                <span>Règlement Intérieur Boxe</span>
              </a>
              <a href="/docs/fiche-inscription-boxe.pdf" download className="document-link">
                <FontAwesomeIcon icon={faDownload} />
                <span>Fiche d'inscription Boxe</span>
              </a>
              <div className="document-item">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>1 photo d'identité + certificat médical</span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === 'social') {
      setModalTitle("Inscription Programme Social-Éducatif");
      setModalContent(
        <div className="modal-content">
          <div className="pricing-section">
            <h3><FontAwesomeIcon icon={faGraduationCap} /> Tarifs</h3>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h4>Activité Périscolaire</h4>
                <div className="price">{formatPrice(social)}<span>/{social.period}</span></div>
                <p>Aide aux devoirs, sorties, etc.</p>
              </div>
            </div>
            <div className="pricing-note">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>{social.note}</span>
            </div>
          </div>

          <div className="documents-section">
            <h3><FontAwesomeIcon icon={faFileAlt} /> Documents à fournir</h3>
            <div className="documents-list">
              <a href="/docs/reglement-social.pdf" download className="document-link">
                <FontAwesomeIcon icon={faDownload} />
                <span>Règlement Intérieur Social</span>
              </a>
              <a href="/docs/fiche-inscription-social.pdf" download className="document-link">
                <FontAwesomeIcon icon={faDownload} />
                <span>Fiche d'inscription Sociale</span>
              </a>
              <div className="document-item">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Photocopie justificatif de domicile + attestation CAF</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    setModalOpen(true);
  };

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Tarifs & inscriptions"
        subtitle="Tarifs, modalités et documents : choisissez votre programme (boxe ou socio-éducatif) et démarrez simplement."
        eyebrow="Simple • Clair • Accompagné"
        actions={[
          { label: "Contact", to: "/contact", className: "btn-secondary" },
          { label: "Horaires", to: "/horaire", className: "btn-outline" },
        ]}
      />

      <section className="pricing-section">
        <div className="container">
          <h2>Choisissez votre programme</h2>
          <p className="section-subtitle">Sélectionnez une catégorie pour voir les tarifs, les documents et les étapes d’inscription.</p>

          {pricingLoading && (
            <div className="public-inline-loading" style={{ justifyContent: 'center', display: 'flex', padding: '2rem 0' }} role="status" aria-live="polite">
              <span className="afb-spinner" aria-hidden />
              <span>Chargement des tarifs…</span>
            </div>
          )}

          {pricingStale && !pricingLoading && (
            <div className="public-banner public-banner--info" role="status">
              Connexion au serveur impossible : les montants affichés correspondent aux tarifs indicatifs du club. Pour confirmation, contactez-nous.
            </div>
          )}
          
          <div className={`pricing-cards${pricingLoading ? ' pricing-cards--muted' : ''}`} aria-busy={pricingLoading}>
            <div className="pricing-card main-card" onClick={() => openModal('boxe')}>
              <div className="card-header">
                <FontAwesomeIcon icon={faFistRaised} className="card-icon" />
                <h3>Boxe Anglaise</h3>
              </div>
              <div className="card-content">
                <div className="price-highlight">
                  <span className="price-from">À partir de</span>
                  <div className="price">
                    {pricing?.boxing?.educative ? formatPrice(pricing.boxing.educative) : '80€'}
                    <span>/an</span>
                  </div>
                </div>
                <ul className="features-list">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Boxe Éducative (enfants)</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Boxe Loisir (adultes)</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Boxe Amateur</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Licence comprise</li>
                </ul>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary">Voir les tarifs</button>
              </div>
            </div>

            <div className="pricing-card main-card" onClick={() => openModal('social')}>
              <div className="card-header">
                <FontAwesomeIcon icon={faGraduationCap} className="card-icon" />
                <h3>Programme Social-Éducatif</h3>
              </div>
              <div className="card-content">
                <div className="price-highlight">
                  <span className="price-from">À partir de</span>
                  <div className="price">
                    {pricing?.social?.periscolaire ? formatPrice(pricing.social.periscolaire) : '30€'}
                    <span>/an</span>
                  </div>
                </div>
                <ul className="features-list">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Aide aux devoirs</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Sorties pédagogiques</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Accompagnement scolaire</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Tarif dégressif CAF</li>
                </ul>
              </div>
              <div className="card-footer">
                <button className="btn btn-secondary">Voir les tarifs</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <FontAwesomeIcon icon={faFileAlt} className="info-icon" />
              <h3>Documents nécessaires</h3>
              <p>Certificat médical, photo d'identité et justificatifs selon le programme choisi.</p>
            </div>
            <div className="info-card">
              <FontAwesomeIcon icon={faCheckCircle} className="info-icon" />
              <h3>Inscription simple</h3>
              <p>On vous accompagne : choix du créneau, informations pratiques et documents à prévoir.</p>
            </div>
            <div className="info-card">
              <FontAwesomeIcon icon={faGraduationCap} className="info-icon" />
              <h3>Encadrement qualifié</h3>
              <p>Encadrement progressif, sécurité, et adaptation aux profils (jeunes, adultes, inclusion).</p>
            </div>
          </div>
        </div>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default Tarif;


