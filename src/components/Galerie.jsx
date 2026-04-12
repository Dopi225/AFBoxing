import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight,  faUsers, faTrophy, faHeart } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

// Import des images (⚡ privilégier des assets légers pour garder une galerie fluide)
// import coach1 from '../assets/coach1.jpg';
// import coach2 from '../assets/coach2.jpg';
// import social from '../assets/social.jpg';
import club from '../assets/club.jpeg';
// import about from '../assets/about.jpg';
import { galleryApi } from '../services/apiService';
import SectionHeader from './SectionHeader';

const Galerie = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await galleryApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (!list || list.length === 0) {
          // Fallback sur quelques images locales si la BDD est vide
          setGalleryImages(list);
        } else {
          setGalleryImages(
            list.map(item => ({
              ...item,
              src: item.image
            }))
          );
        }
      } catch (err) {
        setError(err.message || 'Impossible de charger la galerie.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      <SectionHeader
        title="Galerie"
        subtitle="Un aperçu de la vie du club : entraînements, inclusion, événements et moments partagés."
        eyebrow="Ambiance • Progression • Communauté"
        image={club}
        actions={[
          { label: "Voir les activités", to: "/activite", className: "btn-primary", icon: <FontAwesomeIcon icon={faUsers} /> },
          { label: "Tarifs", to: "/tarif", className: "btn-secondary", icon: <FontAwesomeIcon icon={faHeart} /> },
        ]}
      />

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
          {loading && (
            <div className="gallery-grid">
              <p>Chargement de la galerie...</p>
            </div>
          )}
          {error && !loading && (
            <div className="gallery-grid">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (
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
                      <img src={image.src} alt={image.title} loading="lazy" decoding="async" />
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
          )}
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
                <img src={selectedImage.src} alt={selectedImage.title} loading="eager" decoding="async" />
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
