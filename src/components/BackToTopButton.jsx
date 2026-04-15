import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={`back-to-top ${isVisible ? 'back-to-top--visible' : ''}`}
      onClick={handleClick}
      aria-label="Revenir en haut de la page"
    >
      <FontAwesomeIcon icon={faChevronUp} aria-hidden />
    </button>
  );
}

export default BackToTopButton;

