import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faPlay, faUsers, faTrophy, faHeart } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

// Import des images
import salle from '../assets/salle.jpg';
import coach1 from '../assets/coach1.jpg';
import coach2 from '../assets/coach2.jpg';
import boxeur2 from '../assets/boxeur2.jpg';
import amateur from '../assets/amateur.jpg';
import educative from '../assets/educative.jpg';
import loisir from '../assets/loisir.jpg';
import handiboxe from '../assets/HandiBoxe.jpg';
import aeroboxe from '../assets/aero.jpg';
import therapie from '../assets/terapy.jpg';
import social from '../assets/social.jpg';
import club from '../assets/club.jpeg';

const Galerie = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const galleryImages = [
    { src: salle, title: 'Salle d\'entraînement', category: 'Infrastructure', description: 'Notre salle équipée pour tous les niveaux' },
    { src: coach1, title: 'Entraînement avec coach', category: 'Coaching', description: 'Encadrement professionnel et personnalisé' },
    { src: coach2, title: 'Séance de boxe', category: 'Coaching', description: 'Technique et perfectionnement' },
    { src: boxeur2, title: 'Boxe amateur', category: 'Compétition', description: 'Préparation aux compétitions' },
    { src: amateur, title: 'Boxe amateur', category: 'Compétition', description: 'Niveau compétition encadré' },
    { src: educative, title: 'Boxe éducative', category: 'Jeunesse', description: 'Apprentissage pour les jeunes' },
    { src: loisir, title: 'Boxe loisir', category: 'Loisir', description: 'Pratique détente et bien-être' },
    { src: handiboxe, title: 'Handiboxe', category: 'Inclusion', description: 'Boxe adaptée pour tous' },
    { src: aeroboxe, title: 'Aeroboxe', category: 'Fitness', description: 'Boxe avec musique et cardio' },
    { src: therapie, title: 'Boxe thérapie', category: 'Bien-être', description: 'Boxe pour le bien-être mental' },
    { src: social, title: 'Activités sociales', category: 'Social', description: 'Programme socio-éducatif' },
    { src: club, title: 'Vue du club', category: 'Infrastructure', description: 'Notre espace d\'accueil' }
  ];

  const categories = ['Tous', 'Infrastructure', 'Coaching', 'Compétition', 'Jeunesse', 'Loisir', 'Inclusion', 'Fitness', 'Bien-être', 'Social'];
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filteredImages = activeCategory === 'Tous' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(filteredImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSelectedImage(filteredImages[prevIndex]);
  };

  return (
    <div className="container-fluid">
      <section className="gallery-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Galerie Photos</h1>
            <p>Découvrez l'ambiance et les activités de l'AF Boxing Club 86 à travers nos photos.</p>
          </div>
        </div>
      </section>

      <section className="gallery-section">
        <div className="container">
          {/* Filtres par catégorie */}
          <div className="gallery-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grille de photos */}
          <div className="gallery-grid">
            <AnimatePresence>
              {filteredImages.map((image, index) => (
                <motion.div
                  key={`${image.src}-${index}`}
                  className="gallery-item"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => openLightbox(image, index)}
                >
                  <div className="image-container">
                    <img src={image.src} alt={image.title} />
                    <div className="image-overlay">
                      <div className="overlay-content">
                        <h3>{image.title}</h3>
                        <p>{image.description}</p>
                        <span className="category-badge">{image.category}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={closeLightbox}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              
              <button className="lightbox-nav prev" onClick={prevImage}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              <button className="lightbox-nav next" onClick={nextImage}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>

              <div className="lightbox-image">
                <img src={selectedImage.src} alt={selectedImage.title} />
                <div className="lightbox-info">
                  <h3>{selectedImage.title}</h3>
                  <p>{selectedImage.description}</p>
                  <span className="category-badge">{selectedImage.category}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques */}
      <section className="gallery-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <div className="stat-number">150+</div>
              <div className="stat-label">Membres actifs</div>
            </div>
            <div className="stat-item">
              <FontAwesomeIcon icon={faTrophy} className="stat-icon" />
              <div className="stat-number">25+</div>
              <div className="stat-label">Titres remportés</div>
            </div>
            <div className="stat-item">
              <FontAwesomeIcon icon={faHeart} className="stat-icon" />
              <div className="stat-number">10+</div>
              <div className="stat-label">Années d'expérience</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Galerie;
