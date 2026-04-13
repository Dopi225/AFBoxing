import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEuroSign } from '@fortawesome/free-solid-svg-icons';

const StickyTarifCTA = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname || '/';
  const isAdmin = pathname.startsWith('/admin');
  const isTarifPage = pathname === '/tarif';

  if (isAdmin || isTarifPage) return null;

  return (
    <div className="sticky-tarif-cta" role="region" aria-label="Accès rapide aux tarifs et à l’inscription">
      <button
        type="button"
        className="sticky-tarif-cta__btn"
        onClick={() => navigate('/tarif')}
      >
        <FontAwesomeIcon icon={faEuroSign} />
        Tarifs et inscription
      </button>
    </div>
  );
};

export default StickyTarifCTA;


