import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import image2 from '../assets/logo-removeb.png';
import { prefetchPublicRoute } from '../utils/routePrefetch';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
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

  // Fermer le menu mobile quand on change de page (navigation externe, boutons, etc.)
  useEffect(() => {
    setMenuOpen(false);
    setClubOpen(false);
  }, [location.pathname]);

  return (
    <header>
      <nav className="navbar" id="navbar">
        <Link
          to="/"
          className="logo"
          aria-label="Accueil AF Boxing Club 86"
          onMouseEnter={() => prefetchPublicRoute('/')}
        >
          <img src={image2} alt="" width={500} height={500} loading="lazy" decoding="async" />
        </Link>

        <button
          type="button"
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <FontAwesomeIcon
            icon={menuOpen ? faTimes : faBars}
            className="menu-icon"
            aria-hidden="true"
          />
        </button>

        <ul id="navbar-menu" className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li>
            <NavLink to="/" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/')}>Accueil</NavLink>
          </li>

          <li className={`nav-dropdown ${clubOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="nav-dropdown__toggle"
              aria-haspopup="menu"
              aria-expanded={clubOpen}
              onClick={() => setClubOpen((v) => !v)}
            >
              Club <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </button>
            <ul className="nav-submenu" role="menu">
              <li role="none">
                <NavLink role="menuitem" to="/apropos" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/apropos')}>À propos</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/equipe" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/equipe')}>Équipe</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/actualite" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/actualite')}>Socio-éducatif</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/news" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/news')}>Actualités</NavLink>
              </li>
              <li role="none">
                <NavLink role="menuitem" to="/palmares" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/palmares')}>Palmarès</NavLink>
              </li>
            </ul>
          </li>

          <li>
            <NavLink to="/activite" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/activite')}>Activités</NavLink>
          </li>
          <li>
            <NavLink to="/galerie" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/galerie')}>Galerie</NavLink>
          </li>
          <li>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/contact')}>Contact</NavLink>
          </li>
          <li className="nav-btn-red">
            <NavLink to="/tarif" onClick={() => setMenuOpen(false)} onMouseEnter={() => prefetchPublicRoute('/tarif')}>Inscription</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
