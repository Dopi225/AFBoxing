import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Bouton fixe (icône seule) pour changer de thème, même principe que le retour en haut.
 */
function ThemeFloatButton() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-float-btn"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
    >
      <FontAwesomeIcon icon={dark ? faSun : faMoon} aria-hidden />
    </button>
  );
}

export default ThemeFloatButton;
