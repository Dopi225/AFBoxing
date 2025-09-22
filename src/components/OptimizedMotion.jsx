import React from 'react';
import { motion } from 'framer-motion';

// Variants optimisés pour de meilleures performances
export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Composant optimisé pour les animations
export const OptimizedMotion = ({ 
  children, 
  variant = fadeInUp, 
  className = "",
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      initial={variant.initial}
      whileInView={variant.animate}
      transition={{ ...variant.transition, delay }}
      viewport={{ once: true, margin: "-50px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Composant pour les cartes avec hover optimisé
export const CardMotion = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedMotion;
