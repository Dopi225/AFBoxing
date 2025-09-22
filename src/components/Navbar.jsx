import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import image2 from '../assets/logo-removeb.png';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Gérer scroll et classes CSS en fonction de l'ouverture du menu mobile
  useEffect(() => {
    const navbar = document.getElementById('navbar');
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    if (navbar) {
      navbar.classList.toggle('mobile-open', menuOpen);
    }
    return () => {
      document.body.style.overflow = 'auto';
      if (navbar) navbar.classList.remove('mobile-open');
    };
  }, [menuOpen]);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        closeDropdowns();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fonction pour fermer tous les dropdowns
  const closeDropdowns = () => {
    document.querySelectorAll('.dropdown.open').forEach((el) => {
      el.classList.remove('open');
    });
  };

  // Fonction utilitaire pour naviguer et tout fermer
  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
    closeDropdowns();
  };

  // Gestion du toggle des dropdowns (desktop et mobile)
  const handleDropdownToggle = (e) => {
    e.preventDefault();
    const parent = e.currentTarget.parentNode;
    const isOpen = parent.classList.contains('open');
    
    // Fermer tous les autres dropdowns
    closeDropdowns();
    
    // Ouvrir/fermer le dropdown actuel
    if (!isOpen) {
      parent.classList.add('open');
    }
  };

  return (
    <header>
      <nav className="navbar" id="navbar">
        <div className="logo" onClick={() => handleNavigate('/')}>
          <img src={image2} alt="logo" />
        </div>

        <div
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FontAwesomeIcon 
            icon={menuOpen ? faTimes : faBars} 
            className="menu-icon"
          />
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          {/* Mobile logo option */}
          {/* {menuOpen && (
            <li className="nav-mobile-logo">
              <img src={image2} alt="logo mobile" />
            </li>
          )} */}

          <li><a onClick={() => handleNavigate('/')}>Accueil</a></li>
          <li><a onClick={() => handleNavigate('/apropos')}>Le club</a></li>

          <li className="dropdown">
            <span onClick={handleDropdownToggle}>
              Pratiquer
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </span>
            <ul className="submenu">
              <li><a onClick={() => handleNavigate('/info/educative')}>Boxe Éducative</a></li>
              <li><a onClick={() => handleNavigate('/info/loisir')}>Boxe Loisir</a></li>
              <li><a onClick={() => handleNavigate('/info/amateur')}>Boxe Amateur</a></li>
              <li><a onClick={() => handleNavigate('/info/handiboxe')}>Handiboxe</a></li>
              <li><a onClick={() => handleNavigate('/info/aeroboxe')}>Aeroboxe</a></li>
              <li><a onClick={() => handleNavigate('/info/therapie')}>Boxe Thérapie</a></li>
            </ul>
          </li>

          <li className="dropdown">
            <span onClick={handleDropdownToggle}>
              Socio-éducatif
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </span>
            <ul className="submenu">
              <li><a onClick={() => handleNavigate('/info/aide-devoirs')}>Aide aux devoirs</a></li>
              <li><a onClick={() => handleNavigate('/info/accompagnement-scolaire')}>Accompagnement scolaire</a></li>
              <li><a onClick={() => handleNavigate('/info/orientation')}>Orientation professionnelle</a></li>
              <li><a onClick={() => handleNavigate('/info/sorties-pedagogiques')}>Sorties pédagogiques</a></li>
              <li><a onClick={() => handleNavigate('/info/sorties-familiales')}>Sorties familiales</a></li>
            </ul>
          </li>

          <li><a onClick={() => handleNavigate('/galerie')}>Galerie</a></li>
          <li><a onClick={() => handleNavigate('/partenaire')}>Nos partenaires</a></li>
          <li><a onClick={() => handleNavigate('/contact')}>Contact</a></li>
          <li onClick={() => handleNavigate('/tarif')} className="nav-btn-red">
            <a>Inscription</a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
