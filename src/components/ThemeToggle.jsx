import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ compact = false, className = '' }) => {
  const { dark, toggleTheme } = useTheme();
  const classes = ['theme-toggle', compact && 'theme-toggle--compact', className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'}
    >
      <FontAwesomeIcon icon={dark ? faSun : faMoon} aria-hidden />
      {!compact && <span>{dark ? 'Thème clair' : 'Thème sombre'}</span>}
    </button>
  );
};

export default ThemeToggle;
