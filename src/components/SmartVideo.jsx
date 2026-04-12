import React, { useState, useEffect } from 'react';

const SmartVideo = ({ 
  desktopVideo, 
  mobileVideo, 
  lightVideo, 
  posterImage, 
  className = "background-video" 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showImageFallback, setShowImageFallback] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Détecter la connexion lente
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const isSlow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.downlink < 1.5; // Moins de 1.5 Mbps
      setIsSlowConnection(isSlow);
      
      // Si connexion très lente, afficher directement l'image
      if (connection.effectiveType === 'slow-2g' || connection.downlink < 0.5) {
        setShowImageFallback(true);
      }
    }
  }, []);

  // Timeout pour la vidéo (3 secondes max)
  useEffect(() => {
    const videoTimeout = setTimeout(() => {
      if (!videoLoaded && !videoError) {
        console.log('Video loading timeout - switching to image fallback');
        setShowImageFallback(true);
      }
    }, 3000); // 3 secondes

    return () => clearTimeout(videoTimeout);
  }, [videoLoaded, videoError]);

  // Gestion du chargement de la vidéo
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setShowImageFallback(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowImageFallback(true);
  };

  // Déterminer quelle vidéo utiliser
  const getVideoSource = () => {
    if (isSlowConnection && lightVideo) {
      return lightVideo;
    } else if (isMobile && mobileVideo) {
      return mobileVideo;
    } else {
      return desktopVideo;
    }
  };

  const videoSource = getVideoSource();

  // Si on doit afficher l'image de fallback
  if (showImageFallback) {
    return (
      <div 
        className={`${className} mobile-fallback`}
        style={{
          backgroundImage: `url(${posterImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    );
  }

  // Afficher la vidéo optimisée
  return (
    <video 
      // On évite l'autoplay sur mobile ou connexion lente pour économiser les ressources
      autoPlay={!(isMobile || isSlowConnection)}
      muted 
      loop 
      playsInline 
      className={className}
      poster={posterImage}
      preload="metadata"
      onLoadedData={handleVideoLoad}
      onCanPlay={handleVideoLoad}
      onError={handleVideoError}
      onLoadStart={() => console.log('Smart video loading started')}
      controls={isMobile || isSlowConnection}
    >
      <source src={videoSource} type="video/mp4" />
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
};

export default SmartVideo;
