import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faCalendarAlt, faMapMarkerAlt, faUsers, faEnvelope, faFileSignature, faStar, faCrown } from '@fortawesome/free-solid-svg-icons';
import { OptimizedMotion, CardMotion } from './OptimizedMotion';
import { useNavigate } from 'react-router-dom';
import { palmaresApi } from '../services/apiService';
import SectionHeader from './SectionHeader';

const Palmares = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const stats = React.useMemo(() => {
    const total = achievements.length;
    const champions = achievements.filter((a) => a?.result === 'Champion' || a?.result === 'Vainqueur').length;
    const medals = achievements.filter((a) => String(a?.result || '').includes('Médaillé')).length;
    const boxers = new Set(achievements.map((a) => a?.boxer).filter(Boolean)).size;
    return { total, champions, medals, boxers };
  }, [achievements]);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await palmaresApi.list();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setAchievements(
          list
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } catch (err) {
        setError(err.message || 'Impossible de charger les palmarès.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getResultColor = (result) => {
    switch (result) {
      case 'Champion':
      case 'Vainqueur':
        return 'var(--primary-red)';
      case 'Médaillé d\'Argent':
        return 'var(--secondary-light)';
      case 'Médaillé de Bronze':
        return 'var(--secondary-dark)';
      default:
        return 'var(--primary-red-dark)';
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
      <SectionHeader
        title="Palmarès"
        subtitle="Nos succès et nos moments marquants en compétition : résultats, dates, lieux et boxeurs."
        eyebrow="Sérieux • Performance • Fierté"
        actions={[
          { label: "Activités", to: "/activite", className: "btn-primary" },
          { label: "Contact", to: "/contact", className: "btn-outline" },
        ]}
      />

      {/* Achievements Section */}
      <section className="palmares-main">
        <div className="container">
          <OptimizedMotion>
            <h2>Nos Succès</h2>
          </OptimizedMotion>
          
          <div className="achievements-grid">
            {loading && <p>Chargement des palmarès...</p>}
            {error && !loading && <p>{error}</p>}
            {!loading && !error && achievements.length === 0 && (
              <p>Aucun palmarès enregistré pour le moment.</p>
            )}
            {!loading && !error && achievements.map((achievement, index) => (
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
              <h2>En chiffres</h2>
              <div className="stats-grid">
                <CardMotion className="stat-item" delay={0.1}>
                  <FontAwesomeIcon icon={faCrown} className="stat-icon" />
                  <div className="stat-number">{stats.champions}</div>
                  <div className="stat-label">Titres / victoires</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.2}>
                  <FontAwesomeIcon icon={faMedal} className="stat-icon" />
                  <div className="stat-number">{stats.medals}</div>
                  <div className="stat-label">Médailles</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.3}>
                  <FontAwesomeIcon icon={faUsers} className="stat-icon" />
                  <div className="stat-number">{stats.boxers}</div>
                  <div className="stat-label">Boxeurs (palmarès)</div>
                </CardMotion>
                <CardMotion className="stat-item" delay={0.4}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="stat-icon" />
                  <div className="stat-number">{stats.total}</div>
                  <div className="stat-label">Résultats publiés</div>
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
              <p>Une question sur la compétition, les licences ou les entraînements ? On vous répond.</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                Nous écrire
              </button>
            </CardMotion>

            <CardMotion className="cta-card" delay={0.2}>
              <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
              <h3>Tarifs & inscription</h3>
              <p>Retrouvez les formules et démarrez avec le bon créneau.</p>
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

