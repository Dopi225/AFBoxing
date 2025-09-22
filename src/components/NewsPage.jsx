import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faArrowLeft, faEnvelope, faFileSignature } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import newsItems from '../donnee/newsData';

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
  
  // Trie les actualités du plus récent au plus ancien
  const sortedNews = [...newsItems].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="container-fluid">
      {/* Hero Section */}
      <section className="news-hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <button className="back-btn" onClick={() => navigate('/')}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Retour à l'accueil
            </button>
            <h1>Nos Actualités</h1>
            <p>Restez informé sur toutes nos activités et événements</p>
          </motion.div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-main">
        <div className="container">
          <div className="news-grid">
            {sortedNews.map((item, index) => (
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
                  <img src={item.image} alt={item.title} />
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
            ))}
          </div>
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
              <h3>Newsletter</h3>
              <p>Recevez nos actualités directement dans votre boîte mail.</p>
              <button className="btn btn-primary" onClick={() => navigate('/contact')}>
                S'abonner
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
              <h3>Rejoignez-nous</h3>
              <p>Participez à nos activités et événements en vous inscrivant.</p>
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
