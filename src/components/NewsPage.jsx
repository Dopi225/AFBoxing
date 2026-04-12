import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faArrowLeft, faEnvelope, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '../services/apiService';
import SectionHeader from './SectionHeader';
import newsBg from '../assets/coach1.jpg';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).toUpperCase();
};

const NewsPage = () => {
  const navigate = useNavigate();
  const [news, setNews] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const items = await newsApi.list();
        const list = Array.isArray(items) ? items : (items?.data || []);
        setNews(
          list
            .slice() // copie pour ne pas muter
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } catch (err) {
        setError(err.message || 'Impossible de charger les actualités.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container-fluid">
      <SectionHeader
        title="Actualités"
        subtitle="Restez informé sur la vie du club : événements, compétitions, actions et temps forts."
        eyebrow="Vie du club"
        image={newsBg}
        actions={[
          { label: "Retour accueil", to: "/", className: "btn-outline", icon: <FontAwesomeIcon icon={faArrowLeft} /> },
          { label: "Contact", to: "/contact", className: "btn-secondary", icon: <FontAwesomeIcon icon={faEnvelope} /> },
        ]}
      />

      {/* News Section */}
      <section className="news-main">
        <div className="container">
          {loading && (
            <div className="news-grid">
              <p>Chargement des actualités...</p>
            </div>
          )}
          {error && !loading && (
            <div className="news-grid">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (
            <div className="news-grid">
              {news.length === 0 ? (
                <p>Aucune actualité pour le moment.</p>
              ) : (
                news.map((item, index) => (
                  <motion.article
                    key={item.id}
                    className="news-card"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="news-image">
                    {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
                      <div className="news-date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                    
                    <div className="news-content">
                      <h3>{item.title}</h3>
                      <p className="summary">{item.summary}</p>
                      <p className="description">{item.description}</p>
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="news-cta">
        <div className="container">
          <div className="cta-grid">
            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faEnvelope} className="cta-icon" />
              <h3>Une question ?</h3>
              <p>Envie de participer, proposer une action, ou poser une question sur le club ?</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                Nous écrire
              </button>
            </motion.div>

            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
              <h3>Tarifs & inscription</h3>
              <p>Retrouvez les formules, documents et modalités d’inscription.</p>
              <button className="btn btn-secondary" onClick={() => navigate('/tarif')}>
                S'inscrire
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsPage;
