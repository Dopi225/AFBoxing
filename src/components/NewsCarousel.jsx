// NewsCarousel.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socialImg from '../assets/social.jpg';
import im2 from '../assets/terapy.jpg';
import im3 from '../assets/squat.jpg';
const newsData = [
  {
    id: 1,
    title: "Nouvelle application mobile lancée",
    date: "21 juillet 2025",
    content: "Une nouvelle application a été lancée pour améliorer la gestion des tâches quotidiennes.",
    images: [
      socialImg,
      im2
    ],
  },
  {
    id: 2,
    title: "Conférence internationale à Paris",
    date: "18 juillet 2025",
    content: "Des experts du monde entier se sont réunis pour discuter des enjeux climatiques.",
    images: [
      im3,
      socialImg
    ],
  },
];

export default function NewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = newsData[currentIndex];

  const next = () => setCurrentIndex((prev) => (prev + 1) % newsData.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + newsData.length) % newsData.length);

  return (
    <div className="news-carousel">
      <div className="partenaires-header">
        <h2>Nos Actualités</h2>
        <p>Merci à ceux qui nous soutiennent et partagent nos valeurs</p>
      </div>
      <div className="news-carousel__nav mt-5">
        <button onClick={prev} className="news-carousel__btn">← Précédent</button>
        <button onClick={next} className="news-carousel__btn">Suivant →</button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
  key={current.id}
  initial={{ opacity: 0, x: 80 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -80 }}
  transition={{ duration: 0.4 }}
  className="news-carousel__slide"
>
  {/* Conteneur global (colonne) */}
  <div className="news-carousel__images">
    {current.images.map((src, i) => (
      <img
        key={i}
        src={src}
        alt={`Image ${i + 1}`}
        className="news-carousel__image"
      />
    ))}
  </div>

  {/* Texte en dessous des images */}
  <div className="news-carousel__content">
    <h2 className="news-carousel__title">{current.title}</h2>
    <p className="news-carousel__date">{current.date}</p>
    <p className="news-carousel__text">{current.content}</p>
  </div>
</motion.div>

      </AnimatePresence>
    </div>
  );
}
