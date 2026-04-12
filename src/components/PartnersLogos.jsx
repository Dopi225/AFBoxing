import React from 'react';
import logoPoitiers from '../assets/LOGOPOITIERS.jpg';
import logoFFBoxe from '../assets/FFBOXE.png';
import logoEkidom from '../assets/ekidom.jpg';

const PARTNERS = [
  {
    name: 'Ville de Poitiers',
    logo: logoPoitiers,
    href: 'https://poitiers.fr',
  },
  {
    name: 'FFBOXE',
    logo: logoFFBoxe,
    href: 'https://ffboxe.fr',
  },
  {
    name: 'Ekidom',
    logo: logoEkidom,
    href: 'https://www.ekidom.fr',
  },
];

const PartnersLogos = ({ className = '' }) => {
  return (
    <div className={['home-partners', className].filter(Boolean).join(' ')}>
      <div className="home-partners__head">
        <div>
          <h2 className="section-title">Partenaires</h2>
          <p className="home-section-subtitle">
            Ils nous soutiennent et nous font confiance. Merci à nos partenaires institutionnels, sportifs et sociaux.
          </p>
        </div>
      </div>

      <div className="home-partners__logos" aria-label="Logos partenaires">
        {PARTNERS.map((p) => (
          <a
            key={p.name}
            className="home-partners__logoCard"
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visiter le site : ${p.name}`}
            title={p.name}
          >
            <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default PartnersLogos;


