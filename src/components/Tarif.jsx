import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faFileAlt, faDownload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';

const Tarif = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [modalOpen]);

  const openModal = (type) => {
    if (type === 'boxe') {
      setModalTitle("Inscription Boxe Anglaise");
      setModalContent(
        <div className="modal-content">
          <div className="pricing-section">
            <h3><FontAwesomeIcon icon={faFistRaised} /> Tarifs</h3>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h4>Boxe Éducative</h4>
                <div className="price">80€<span>/an</span></div>
                <p>Enfants et adolescents (-18 ans)</p>
              </div>
              <div className="pricing-card featured">
                <h4>Boxe Loisir/Amateur</h4>
                <div className="price">120€<span>/an</span></div>
                <p>Adultes (18 ans et plus)</p>
              </div>
            </div>
            <div className="pricing-note">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>Licence comprise – Certificat médical obligatoire</span>
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
                <div className="price">30€<span>/an</span></div>
                <p>Aide aux devoirs, sorties, etc.</p>
              </div>
            </div>
            <div className="pricing-note">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>Tarif dégressif selon quotient familial (CAF)</span>
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
      <section className="pricing-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Tarifs et Inscriptions</h1>
            <p>Rejoignez l'AF Boxing Club 86 et découvrez nos programmes adaptés à tous les âges et tous les besoins.</p>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <h2>Choisissez votre programme</h2>
          <p className="section-subtitle">Sélectionnez une catégorie pour consulter les tarifs et les documents d'inscription.</p>
          
          <div className="pricing-cards">
            <div className="pricing-card main-card" onClick={() => openModal('boxe')}>
              <div className="card-header">
                <FontAwesomeIcon icon={faFistRaised} className="card-icon" />
                <h3>Boxe Anglaise</h3>
              </div>
              <div className="card-content">
                <div className="price-highlight">
                  <span className="price-from">À partir de</span>
                  <div className="price">80€<span>/an</span></div>
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
                  <div className="price">30€<span>/an</span></div>
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
              <p>Processus d'inscription rapide et accompagnement personnalisé pour tous les nouveaux membres.</p>
            </div>
            <div className="info-card">
              <FontAwesomeIcon icon={faGraduationCap} className="info-icon" />
              <h3>Encadrement qualifié</h3>
              <p>Équipe d'éducateurs diplômés et expérimentés pour un suivi de qualité.</p>
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


