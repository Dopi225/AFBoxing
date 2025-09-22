import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // petit délai pour laisser le DOM se mettre à jour
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto', // ou 'smooth' si tu veux une animation
      });
    }, 10);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
