import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faFileAlt, faDownload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import { pricingApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
import { ErrorState } from './PageStates';
import '../style/Tarif.scss';

const formatPrice = (price) => {
  if (!price) return '—';
  if (price.amount === 0) return 'Gratuit';
  if (typeof price.amount === 'number') return `${price.amount}€`;
  return String(price.amount);
};

const BOXING_KEY_ORDER = ['educative', 'loisir', 'amateur', 'handiboxe', 'aeroboxe', 'therapie'];

const sortedCategoryEntries = (grouped, category) => {
  const o = grouped?.[category];
  if (!o || typeof o !== 'object') return [];
  const order = category === 'boxing' ? BOXING_KEY_ORDER : [];
  return Object.entries(o).sort(([a], [b]) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    const va = ia === -1 ? 500 : ia;
    const vb = ib === -1 ? 500 : ib;
    if (va !== vb) return va - vb;
    return a.localeCompare(b);
  });
};

const minAmountInCategory = (grouped, category) => {
  const entries = sortedCategoryEntries(grouped, category);
  const nums = entries.map(([, v]) => v?.amount).filter((a) => typeof a === 'number' && !Number.isNaN(a));
  return nums.length ? Math.min(...nums) : null;
};

const aggregateFooterNote = (entries) => {
  const notes = entries.map(([, v]) => v?.note).filter(Boolean);
  if (!notes.length) return null;
  const first = notes[0];
  if (notes.every((n) => n === first)) return first;
  return 'Les modalités peuvent varier selon la formule (licence, certificat médical, etc.).';
};

const Tarif = () => {
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [seasonLabel, setSeasonLabel] = useState('');
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState('');

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [modalOpen]);

  useEffect(() => {
    const loadPricing = async () => {
      setPricingLoading(true);
      setPricingError('');
      try {
        const data = await pricingApi.list();
        if (data && typeof data === 'object' && data.season) {
          setSeasonLabel(data.season.label || '');
          // Conserver boxing/social au même niveau pour le reste du composant
          setPricing(data);
        } else {
          setSeasonLabel('');
          setPricing(data);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Error loading pricing:', err);
        }
        setPricing(null);
        setSeasonLabel('');
        setPricingError('Les tarifs sont temporairement indisponibles. Contactez le club pour connaître les montants à jour.');
      } finally {
        setPricingLoading(false);
      }
    };

    loadPricing();
  }, []);

  /** Aligné avec InfoPage / activityPublicLinks : ?programme=boxe|boxing|social */
  useEffect(() => {
    const p = (searchParams.get('programme') || '').toLowerCase();
    if (!p || pricingLoading) return;
    const id = p === 'social' ? 'programme-social' : 'programme-boxe';
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [searchParams, pricingLoading]);

  const startBoxing = pricing ? minAmountInCategory(pricing, 'boxing') : null;
  const startSocial = pricing ? minAmountInCategory(pricing, 'social') : null;

  const openModal = (type) => {
    if (!pricing) return;

    const boxingRows = sortedCategoryEntries(pricing, 'boxing');
    const socialRows = sortedCategoryEntries(pricing, 'social');

    const boxingFooterNote = aggregateFooterNote(boxingRows);
    const socialFooterNote = aggregateFooterNote(socialRows);

    const emptyCategoryMsg = (
      <p className="pricing-empty-category">Aucun tarif publié pour cette catégorie. Contactez-nous pour plus d&apos;informations.</p>
    );

    if (type === 'boxe') {
      setModalTitle("Inscription Boxe Anglaise");
      setModalContent(
        <div className="modal-content">
          <div className="pricing-section">
            <h3><FontAwesomeIcon icon={faFistRaised} /> Tarifs</h3>
            {boxingRows.length === 0 ? emptyCategoryMsg : (
            <div className="pricing-grid">
              {boxingRows.map(([key, item]) => (
                <div
                  key={key}
                  className={`pricing-card${key === 'loisir' || key === 'amateur' ? ' featured' : ''}`}
                >
                  <h4>{item.label}</h4>
                  <div className="price">
                    {formatPrice(item)}
                    <span>/{item.period || 'an'}</span>
                  </div>
                  {item.note && <p className="pricing-card-note">{item.note}</p>}
                </div>
              ))}
            </div>
            )}
            {boxingFooterNote && (
              <div className="pricing-note">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{boxingFooterNote}</span>
              </div>
            )}
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
            {socialRows.length === 0 ? emptyCategoryMsg : (
            <div className="pricing-grid">
              {socialRows.map(([key, item]) => (
                <div key={key} className="pricing-card">
                  <h4>{item.label}</h4>
                  <div className="price">
                    {formatPrice(item)}
                    <span>/{item.period || 'an'}</span>
                  </div>
                  {item.note && <p className="pricing-card-note">{item.note}</p>}
                </div>
              ))}
            </div>
            )}
            {socialFooterNote && (
              <div className="pricing-note">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{socialFooterNote}</span>
              </div>
            )}
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
        subtitle={
          seasonLabel
            ? `Saison ${seasonLabel} — Tarifs, modalités et documents : choisissez votre programme (boxe ou socio-éducatif) et démarrez simplement.`
            : 'Tarifs, modalités et documents : choisissez votre programme (boxe ou socio-éducatif) et démarrez simplement.'
        }
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
            <div className="tarif-loading" role="status" aria-live="polite">
              <span className="afb-spinner" aria-hidden />
              <span>Chargement des tarifs…</span>
            </div>
          )}

          {pricingError && !pricingLoading && (
            <ErrorState
              title="Tarifs indisponibles"
              message={pricingError}
              onRetry={() => window.location.reload()}
            />
          )}

          {!pricingLoading && !pricingError && (
          <div className="pricing-cards" aria-busy={pricingLoading}>
            <div
              id="programme-boxe"
              className="pricing-card main-card"
              onClick={() => openModal('boxe')}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faFistRaised} className="card-icon" />
                <h3>Boxe Anglaise</h3>
              </div>
              <div className="card-content">
                <div className="price-highlight">
                  <span className="price-from">À partir de</span>
                  <div className="price">
                    {startBoxing != null ? `${startBoxing}€` : '—'}
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

            <div
              id="programme-social"
              className="pricing-card main-card"
              onClick={() => openModal('social')}
            >
              <div className="card-header">
                <FontAwesomeIcon icon={faGraduationCap} className="card-icon" />
                <h3>Programme Social-Éducatif</h3>
              </div>
              <div className="card-content">
                <div className="price-highlight">
                  <span className="price-from">À partir de</span>
                  <div className="price">
                    {startSocial != null ? `${startSocial}€` : '—'}
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
          )}
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


