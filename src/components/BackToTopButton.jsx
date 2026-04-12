import { useEffect, useState } from 'react';

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
      <i className="fas fa-chevron-up" aria-hidden="true" />
    </button>
  );
}

export default BackToTopButton;

