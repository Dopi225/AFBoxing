import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import image2 from '../assets/logo-removeb.png';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Fonction utilitaire pour naviguer et tout fermer
  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // Fermer le menu mobile quand on change de page (navigation externe, boutons, etc.)
  useEffect(() => {
    setMenuOpen(false);
    setClubOpen(false);
  }, [location.pathname]);

  return (
    <header>
      <nav className="navbar" id="navbar">
        <div className="logo" onClick={() => handleNavigate('/')}>
          <img src={image2} alt="logo" loading="lazy" />
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
          <li>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>Accueil</NavLink>
          </li>

          <li className={`nav-dropdown ${clubOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="nav-dropdown__toggle"
              aria-haspopup="menu"
              aria-expanded={clubOpen}
              onClick={() => setClubOpen((v) => !v)}
            >
              Le club <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </button>
            <ul className="nav-submenu" role="menu">
              <li role="none">
                <NavLink role="menuitem" to="/apropos" onClick={() => setMenuOpen(false)}>À propos</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/equipe" onClick={() => setMenuOpen(false)}>Équipe</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/actualite" onClick={() => setMenuOpen(false)}>Socio-éducatif</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/news" onClick={() => setMenuOpen(false)}>Actualités</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/palmares" onClick={() => setMenuOpen(false)}>Palmarès</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/partenaire" onClick={() => setMenuOpen(false)}>Partenaires</NavLink>
              </li>
            </ul>
          </li>

          <li>
            <NavLink to="/activite" onClick={() => setMenuOpen(false)}>Activités</NavLink>
          </li>
          <li>
            <NavLink to="/galerie" onClick={() => setMenuOpen(false)}>Galerie</NavLink>
          </li>
          <li>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          </li>
          <li className="nav-btn-red">
            <NavLink to="/tarif" onClick={() => setMenuOpen(false)}>Tarifs / S'inscrire</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
