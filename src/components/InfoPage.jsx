import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised, faGraduationCap, faHeart, faMusic, faBrain, faWheelchair, faCalendarAlt, faTrophy, faEnvelope, faFileSignature, faUsers, faMapMarkerAlt, faLightbulb, faHome } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const InfoPage = () => {
    const navigate = useNavigate(); 
  const { type } = useParams();

  const activityInfo = {
    educative: {
      title: 'Boxe Éducative',
      icon: faGraduationCap,
      description: 'Découvrez la boxe éducative, une pratique adaptée aux jeunes de 8 à 17 ans.',
      content: `La boxe éducative est une discipline sportive qui s'adresse aux jeunes souhaitant découvrir la boxe dans un cadre sécurisé et éducatif. Cette pratique met l'accent sur l'apprentissage technique, le respect des règles et le développement personnel.

      **Objectifs :**
      - Développer la coordination et la motricité
      - Apprendre les techniques de base de la boxe
      - Renforcer la confiance en soi
      - Encourager le respect et la discipline
      - Favoriser l'esprit d'équipe

      **Encadrement :**
      Nos éducateurs diplômés assurent un encadrement de qualité avec une approche pédagogique adaptée à chaque âge. La sécurité est notre priorité absolue.`,
      age: '8-17 ans',
      schedule: 'Lundi, Mercredi, Vendredi 18h-19h',
      equipment: 'Gants et protège-dents fournis',
      price: '150€/an'
    },
    loisir: {
      title: 'Boxe Loisir',
      icon: faHeart,
      description: 'Pratiquez la boxe pour le plaisir, sans compétition.',
      content: `La boxe loisir s'adresse à tous ceux qui souhaitent pratiquer la boxe pour le plaisir, sans objectif de compétition. C'est une excellente activité pour se défouler, se maintenir en forme et apprendre les techniques de base.

      **Bénéfices :**
      - Amélioration de la condition physique
      - Développement de la coordination
      - Gestion du stress
      - Renforcement musculaire
      - Travail cardio-vasculaire

      **Déroulement :**
      Les séances comprennent un échauffement, l'apprentissage des techniques de base, des exercices de mise en situation et un retour au calme. L'ambiance est conviviale et bienveillante.`,
      age: 'Tous âges',
      schedule: 'Mardi, Jeudi 19h-20h, Samedi 11h-12h',
      equipment: 'Tenue de sport, gants fournis',
      price: '180€/an'
    },
    amateur: {
      title: 'Boxe Amateur',
      icon: faFistRaised,
      description: 'Pour les boxeurs engagés souhaitant participer aux compétitions.',
      content: `La boxe amateur est destinée aux boxeurs les plus engagés qui souhaitent participer aux compétitions officielles de la Fédération Française de Boxe. Cette pratique nécessite un engagement important et une régularité dans l'entraînement.

      **Exigences :**
      - Niveau technique confirmé
      - Engagement régulier
      - Respect des règles de compétition
      - Licence FFB obligatoire
      - Certificat médical

      **Entraînement :**
      Les séances sont intensives et comprennent un travail technique poussé, de la préparation physique spécifique et des sparrings contrôlés. L'objectif est la performance en compétition.`,
      age: '16+ ans',
      schedule: 'Lundi, Mercredi, Vendredi 20h-21h',
      equipment: 'Équipement complet de compétition',
      price: '220€/an + licence FFB'
    },
    handiboxe: {
      title: 'Handiboxe',
      icon: faWheelchair,
      description: 'Boxe adaptée aux personnes en situation de handicap.',
      content: `L'handiboxe est une pratique adaptée aux personnes en situation de handicap. Elle permet de découvrir la boxe dans un cadre sécurisé et adapté, favorisant l'inclusion par le sport.

      **Adaptations :**
      - Techniques adaptées selon le handicap
      - Matériel spécialisé
      - Encadrement qualifié
      - Progression individualisée
      - Accessibilité des locaux

      **Bénéfices :**
      - Amélioration de la condition physique
      - Développement de la confiance
      - Socialisation et inclusion
      - Dépassement de soi
      - Bien-être psychologique`,
      age: 'Tous âges',
      schedule: 'Mardi, Vendredi 18h-19h',
      equipment: 'Matériel adapté fourni',
      price: '120€/an'
    },
    aeroboxe: {
      title: 'Aeroboxe',
      icon: faMusic,
      description: 'Boxe sans contact avec musique pour le cardio et la coordination.',
      content: `L'aeroboxe combine les mouvements de boxe avec de la musique pour créer une séance dynamique et rythmée. C'est une activité sans contact qui travaille le cardio et la coordination.

      **Caractéristiques :**
      - Mouvements de boxe sur musique
      - Pas de contact physique
      - Travail cardio intense
      - Amélioration de la coordination
      - Ambiance festive

      **Déroulement :**
      Chaque séance suit un rythme musical avec des enchaînements de coups de poing, de coups de pied et de mouvements de coordination. L'objectif est de se dépenser tout en s'amusant.`,
      age: 'Tous âges',
      schedule: 'Mardi, Jeudi 19h-20h',
      equipment: 'Tenue de sport, chaussures de sport',
      price: '160€/an'
    },
    therapie: {
      title: 'Boxe Thérapie',
      icon: faBrain,
      description: 'Utilisation de la boxe dans une démarche de bien-être mental.',
      content: `La boxe thérapie utilise les techniques de boxe dans une démarche de bien-être mental et de gestion des émotions. Cette approche thérapeutique aide à gérer le stress, l'anxiété et à développer la confiance en soi.

      **Objectifs thérapeutiques :**
      - Gestion du stress et de l'anxiété
      - Développement de la confiance
      - Canalisation de l'agressivité
      - Amélioration de l'estime de soi
      - Relaxation et bien-être

      **Méthode :**
      Les séances combinent exercices de boxe, techniques de respiration et relaxation. L'encadrement est assuré par des professionnels formés à l'approche thérapeutique.`,
      age: 'Tous âges',
      schedule: 'Mercredi 19h-20h, Samedi 10h-11h',
      equipment: 'Gants et protège-dents fournis',
      price: '200€/an'
    },
    'aide-devoirs': {
      title: 'Aide aux devoirs',
      icon: faGraduationCap,
      description: 'Encadrement bienveillant pour soutenir les enfants dans leurs devoirs après l\'école.',
      content: `L'aide aux devoirs est un service essentiel de notre programme socio-éducatif. Nos animateurs qualifiés accompagnent les enfants dans leurs devoirs dans un cadre bienveillant et structuré.

      **Objectifs :**
      - Aider les enfants à faire leurs devoirs
      - Créer un environnement d'étude favorable
      - Développer l'autonomie et la méthodologie
      - Renforcer la confiance en soi
      - Maintenir le lien avec l'école

      **Encadrement :**
      Nos éducateurs diplômés assurent un suivi personnalisé et adapté à chaque enfant. L'aide aux devoirs se déroule après l'école pour permettre aux enfants de rentrer chez eux avec leurs devoirs terminés.`,
      age: '6-16 ans',
      schedule: 'Lundi au Vendredi 16h30-18h00',
      equipment: 'Matériel scolaire fourni',
      price: 'Gratuit'
    },
    'accompagnement-scolaire': {
      title: 'Accompagnement scolaire',
      icon: faUsers,
      description: 'Un suivi régulier avec des animateurs qualifiés pour progresser à l\'école.',
      content: `L'accompagnement scolaire s'adresse aux enfants en difficulté scolaire. Nos éducateurs travaillent en collaboration avec les familles et les enseignants pour assurer un suivi cohérent.

      **Méthode :**
      - Évaluation des besoins de l'enfant
      - Mise en place d'un plan d'accompagnement personnalisé
      - Suivi régulier avec les familles
      - Collaboration avec les enseignants
      - Bilan trimestriel

      **Bénéfices :**
      - Amélioration des résultats scolaires
      - Renforcement de la confiance
      - Développement de l'autonomie
      - Meilleure communication famille-école`,
      age: '6-18 ans',
      schedule: 'Sur rendez-vous',
      equipment: 'Matériel pédagogique adapté',
      price: 'Gratuit'
    },
    'orientation': {
      title: 'Orientation professionnelle',
      icon: faLightbulb,
      description: 'Des ateliers pour aider les jeunes à s\'orienter dans leur parcours scolaire ou professionnel.',
      content: `L'orientation professionnelle aide les jeunes à construire leur projet d'avenir. Nos ateliers permettent de découvrir les métiers et les formations.

      **Activités :**
      - Ateliers de découverte des métiers
      - Rencontres avec des professionnels
      - Visites d'entreprises et d'établissements
      - Aide à la rédaction de CV et lettres de motivation
      - Préparation aux entretiens

      **Objectifs :**
      - Aider à définir un projet professionnel
      - Découvrir les différentes voies de formation
      - Développer les compétences de recherche d'emploi
      - Renforcer la confiance en l'avenir`,
      age: '14-25 ans',
      schedule: 'Mercredi 14h-16h',
      equipment: 'Matériel informatique et documentation',
      price: 'Gratuit'
    },
    'sorties-pedagogiques': {
      title: 'Sorties pédagogiques',
      icon: faMapMarkerAlt,
      description: 'Sorties culturelles et éducatives pour découvrir le monde autrement.',
      content: `Les sorties pédagogiques permettent aux enfants de découvrir leur environnement et d'enrichir leurs connaissances de manière ludique et interactive.

      **Types de sorties :**
      - Visites de musées et expositions
      - Découverte de parcs naturels
      - Visites d'entreprises locales
      - Sorties culturelles (théâtre, cinéma)
      - Activités sportives en extérieur

      **Bénéfices :**
      - Ouverture culturelle
      - Développement de la curiosité
      - Apprentissage par l'expérience
      - Renforcement du lien social
      - Découverte de nouveaux horizons`,
      age: '6-16 ans',
      schedule: 'Pendant les vacances scolaires',
      equipment: 'Transport et repas fournis',
      price: 'Gratuit'
    },
    'sorties-familiales': {
      title: 'Sorties familiales',
      icon: faHome,
      description: 'Moments de partage entre familles pour renforcer les liens et créer des souvenirs.',
      content: `Les sorties familiales favorisent les échanges et renforcent les liens familiaux. Ces moments de partage créent des souvenirs précieux et renforcent la cohésion familiale.

      **Activités proposées :**
      - Pique-niques en famille
      - Visites de sites touristiques
      - Activités sportives en famille
      - Ateliers créatifs parents-enfants
      - Soirées conviviales

      **Objectifs :**
      - Renforcer les liens familiaux
      - Créer des moments de partage
      - Développer la communication
      - Favoriser l'entraide
      - Créer des souvenirs positifs`,
      age: 'Toute la famille',
      schedule: 'Un dimanche par mois',
      equipment: 'Matériel d\'activité fourni',
      price: 'Gratuit'
    }
  };

  const info = activityInfo[type];

  if (!info) {
    return (
      <div className="container-fluid">
        <section className="error-section">
          <div className="container">
            <h1>Activité non trouvée</h1>
            <p>L'activité demandée n'existe pas.</p>
            <button className="btn btn-primary" onClick={() => navigate('/activite')}>
              Retour aux activités
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Hero Section */}
      <section className="info-hero">
        <div className="container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="hero-icon-container"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <FontAwesomeIcon icon={info.icon} className="hero-icon" />
            </motion.div>
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {info.title}
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {info.description}
            </motion.p>
            <motion.div 
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span className="badge-text">Activité</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="info-content">
        <div className="container">
          <div className="content-grid">
            <motion.div 
              className="main-content"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="content-card">
                <div className="content-header">
                  <h2>À propos de cette activité</h2>
                  <div className="content-divider"></div>
                </div>
                <div className="content-text">
                  {info.content.split('\n\n').map((paragraph, index) => (
                    <motion.p 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="info-sidebar"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="info-card">
                <div className="info-card-header">
                  <div className="header-content">
                    <h3>Informations pratiques</h3>
                    <p>Détails de l'activité</p>
                  </div>
                  <div className="info-card-icon">
                    <FontAwesomeIcon icon={faFistRaised} />
                  </div>
                </div>
                
                <div className="info-sections">
                  {/* Section Âge */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon age-icon">
                        <FontAwesomeIcon icon={faGraduationCap} />
                      </div>
                      <h4>Âge requis</h4>
                    </div>
                    <div className="section-content">
                      <span className="section-value">{info.age}</span>
                    </div>
                  </motion.div>
                  
                  {/* Section Horaires */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon schedule-icon">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                      <h4>Horaires</h4>
                    </div>
                    <div className="section-content">
                      <span className="section-value">{info.schedule}</span>
                    </div>
                  </motion.div>
                  
                  {/* Section Équipement */}
                  <motion.div 
                    className="info-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon equipment-icon">
                        <FontAwesomeIcon icon={faFistRaised} />
                      </div>
                      <h4>Équipement</h4>
                    </div>
                    <div className="section-content">
                      <span className="section-value">{info.equipment}</span>
                    </div>
                  </motion.div>
                  
                  {/* Section Tarif - Mise en évidence */}
                  <motion.div 
                    className="info-section price-section"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="section-header">
                      <div className="section-icon price-icon">
                        <FontAwesomeIcon icon={faTrophy} />
                      </div>
                      <h4>Tarif</h4>
                    </div>
                    <div className="section-content">
                      <div className="price-display">
                        <span className="price-value">{info.price}</span>
                        <span className="price-period">/an</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Bouton d'action */}
                <motion.div 
                  className="info-action"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <button className="btn btn-primary btn-full" onClick={() => navigate('/contact')}>
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>Nous contacter</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        </section>

      {/* CTA Section */}
      <section className="info-cta">
        <div className="container">
          <motion.div 
            className="cta-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2>Prêt à commencer ?</h2>
            <p>Rejoignez-nous et découvrez cette activité passionnante</p>
          </motion.div>
          
          <div className="cta-grid">
            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <div className="cta-card-header">
                <motion.div 
                  className="cta-icon-container"
                  whileHover={{ 
                    rotate: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="cta-icon" />
                </motion.div>
                <h3>Nous contacter</h3>
              </div>
              <p>Pour plus d'informations sur cette activité.</p>
              <motion.button 
                className="btn btn-primary" 
                onClick={() => navigate('/contact')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contactez-nous
              </motion.button>
            </motion.div>

            <motion.div 
              className="cta-card"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <div className="cta-card-header">
                <motion.div 
                  className="cta-icon-container"
                  whileHover={{ 
                    rotate: 360,
                    transition: { duration: 0.6 }
                  }}
                >
                  <FontAwesomeIcon icon={faFileSignature} className="cta-icon" />
                </motion.div>
                <h3>S'inscrire</h3>
              </div>
              <p>Inscrivez-vous à cette activité dès maintenant.</p>
              <motion.button 
                className="btn btn-secondary" 
                onClick={() => navigate('/tarif')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                S'inscrire
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InfoPage;
