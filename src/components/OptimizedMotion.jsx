import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Aligné sur MotionConfig dans App.jsx */
export const PREMIUM_EASE = [0.22, 1, 0.36, 1];
const VIEWPORT = { once: true, margin: '-40px', amount: 0.15 };

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: PREMIUM_EASE },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.22, ease: PREMIUM_EASE },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.28, ease: PREMIUM_EASE },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const OptimizedMotion = ({
  children,
  variant = fadeInUp,
  className = '',
  delay = 0,
  ...props
}) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={variant.initial}
      whileInView={variant.animate}
      transition={{ ...variant.transition, delay }}
      viewport={VIEWPORT}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardMotion = ({ children, className = '', delay = 0 }) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: PREMIUM_EASE }}
      viewport={VIEWPORT}
      whileHover={{
        scale: 1.015,
        transition: { duration: 0.2, ease: PREMIUM_EASE },
      }}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedMotion;
