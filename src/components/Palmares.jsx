import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faCalendarAlt, faMapMarkerAlt, faUsers, faEnvelope, faFileSignature, faStar, faCrown } from '@fortawesome/free-solid-svg-icons';
import { OptimizedMotion, CardMotion, fadeInUp } from './OptimizedMotion';
import { useNavigate } from 'react-router-dom';

const Palmares = () => {
  const navigate = useNavigate();

  const achievements = [
    {
      id: 1,
      title: 'Championnat Régional Nouvelle-Aquitaine',
      date: '2024-03-15',
      location: 'Poitiers',
      category: 'Boxe Amateur',
      result: 'Champion',
      boxer: 'Mohamed Benali',
      details: 'Victoire par décision unanime contre le champion de Bordeaux. Combat très disputé sur 3 rounds avec une technique remarquable.',
      image: 'trophy1.jpg'
    },
    {
      id: 2,
      title: 'Tournoi Inter-clubs Vienne',
      date: '2024-02-10',
      location: 'Châtellerault',
      category: 'Boxe Éducative',
      result: 'Vainqueur',
      boxer: 'Équipe AF Boxing',
      details: 'Victoire collective de notre équipe éducative avec 3 victoires sur 4 combats. Excellent esprit d\'équipe et technique.',
      image: 'trophy2.jpg'
    },
    {
      id: 3,
      title: 'Championnat Handiboxe',
      date: '2024-01-20',
      location: 'La Rochelle',
      category: 'Handiboxe',
      result: 'Médaillé d\'Argent',
      boxer: 'Sophie Martin',
      details: 'Première participation en compétition handiboxe. Performance remarquable et esprit sportif exemplaire.',
      image: 'trophy3.jpg'
    },
    {
      id: 4,
      title: 'Coupe de France Amateur',
      date: '2023-12-05',
      location: 'Paris',
      category: 'Boxe Amateur',
      result: 'Demi-finaliste',
      boxer: 'Karim Traoré',
      details: 'Excellent parcours jusqu\'en demi-finale. Défaite honorable contre le futur champion de France.',
      image: 'trophy4.jpg'
    },
    {
      id: 5,
      title: 'Tournoi Jeunes Espoirs',
      date: '2023-11-18',
      location: 'Angoulême',
      category: 'Boxe Éducative',
      result: 'Champion',
      boxer: 'Lucas Dubois',
      details: 'Victoire technique parfaite. Le jeune boxeur montre un grand potentiel pour l\'avenir.',
      image: 'trophy5.jpg'
    },
    {
      id: 6,
      title: 'Championnat Inter-régional',
      date: '2023-10-12',
      location: 'Limoges',
      category: 'Boxe Amateur',
      result: 'Médaillé de Bronze',
      boxer: 'Fatima Alami',
      details: 'Première compétition importante pour notre boxeuse. Performance encourageante et belle progression.',
      image: 'trophy6.jpg'
    }
  ];

  const getResultColor = (result) => {
    switch (result) {
      case 'Champion':
      case 'Vainqueur':
        return 'var(--primary-red)';
      case 'Médaillé d\'Argent':
        return '#C0C0C0';
      case 'Médaillé de Bronze':
        return '#CD7F32';
      default:
        return 'var(--primary-orange)';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'Champion':
        return faCrown;
      case 'Vainqueur':
        return faTrophy;
      case 'Médaillé d\'Argent':
        return faMedal;
      case 'Médaillé de Bronze':
        return faMedal;
      default:
        return faStar;
    }
  };

  return (
    <div className="container-fluid">
      {/* Hero Section */}
      <section className="palmares-hero">
        <div className="container">
          <OptimizedMotion variant={fadeInUp}>
            <div className="hero-content">
              <h1>🏆 Palmarès</h1>
              <p>Nos succès et nos moments de gloire en compétition</p>
            </div>
          </OptimizedMotion>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="palmares-main">
        <div className="container">
          <OptimizedMotion>
            <h2>Nos Succès</h2>
          </OptimizedMotion>
          
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <CardMotion
                key={achievement.id}
                className="achievement-card"
                delay={index * 0.1}
              >
                <div className="card-header">
                  <div className="result-badge" style={{ backgroundColor: getResultColor(achievement.result) }}>
                    <FontAwesomeIcon icon={getResultIcon(achievement.result)} />
                    <span>{achievement.result}</span>
                  </div>
                  <h3>{achievement.title}</h3>
                </div>
                
                <div className="card-content">
                  <div className="achievement-info">
                    <div className="info-item">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>{new Date(achievement.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="info-item">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>{achievement.location}</span>
                    </div>
                    <div className="info-item">
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{achievement.boxer}</span>
                    </div>
                  </div>
                  
                  <div className="category">
                    <span className="category-badge">{achievement.category}</span>
                  </div>
                  
                  <p className="details">{achievement.details}</p>
                </div>
              </CardMotion>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="palmares-stats">
        <div className="container">
          <OptimizedMotion>
            <div className="stats-content">
              <h2>Nos Statistiques</h2>
              <div className="stats-grid">
                <CardMotion className="stat-item" delay={0.1}>
                  <FontAwesomeIcon icon={faCrown} className="stat-icon" />
                  <div className="stat-number">12</div>
                  <div className="stat-label">Titres remportés</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.2}>
                  <FontAwesomeIcon icon={faMedal} className="stat-icon" />
                  <div className="stat-number">28</div>
                  <div className="stat-label">Médailles</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.3}>
                  <FontAwesomeIcon icon={faUsers} className="stat-icon" />
                  <div className="stat-number">45</div>
                  <div className="stat-label">Boxeurs actifs</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.4}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="stat-icon" />
                  <div className="stat-number">8</div>
                  <div className="stat-label">Années d'existence</div>
                </CardMotion>
              </div>
            </div>
          </OptimizedMotion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="palmares-cta">
        <div className="container">
          <div className="cta-grid">
            <CardMotion className="cta-card" delay={0.1}>
              <FontAwesomeIcon icon={faEnvelope} className="cta-icon" />
              <h3>Nous contacter</h3>
              <p>Pour plus d'informations sur nos compétitions et entraînements.</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                Contactez-nous
              </button>
            </CardMotion>

            <CardMotion className="cta-card" delay={0.2}>
              <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
              <h3>Rejoignez-nous</h3>
              <p>Intégrez notre club et participez aux prochaines compétitions.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/tarif')}>
                S'inscrire
              </button>
            </CardMotion>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Palmares;

