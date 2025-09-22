// newsData.js
import salle from '../assets/salle.jpg';
import educative from '../assets/educative.jpg';
import social from '../assets/social.jpg';
import amateur from '../assets/amateur.jpg';
import handiboxe from '../assets/HandiBoxe.jpg';
import coach1 from '../assets/coach1.jpg';

const newsItems = [
  {
    id: 1,
    title: 'Nouvelle saison 2024-2025',
    date: '2024-09-15',
    summary: 'Démarrage de la nouvelle saison avec de nouveaux horaires et programmes enrichis.',
    description: 'L\'AF Boxing Club 86 ouvre ses portes pour une nouvelle saison riche en nouveautés. Découvrez nos nouveaux créneaux horaires et nos programmes élargis pour tous les âges.',
    image: salle
  },
  {
    id: 2,
    title: 'Programme Boxe Éducative',
    date: '2024-09-10',
    summary: 'Lancement du programme spécial pour les jeunes de 8 à 17 ans.',
    description: 'Notre programme de boxe éducative s\'adresse aux jeunes souhaitant découvrir la boxe dans un cadre sécurisé et éducatif. Encadrement par des éducateurs diplômés.',
    image: educative
  },
  {
    id: 3,
    title: 'Activités Socio-éducatives',
    date: '2024-09-05',
    summary: 'Accompagnement scolaire et sorties pédagogiques pour les familles.',
    description: 'Le club propose un accompagnement scolaire et des activités socio-éducatives pour soutenir les familles du quartier. Aide aux devoirs et sorties culturelles.',
    image: social
  },
  {
    id: 4,
    title: 'Compétitions Amateurs',
    date: '2024-08-28',
    summary: 'Nos boxeurs amateurs se préparent pour les prochaines compétitions régionales.',
    description: 'L\'équipe amateur de l\'AF Boxing Club 86 s\'entraîne intensivement pour les prochaines compétitions de la Fédération Française de Boxe.',
    image: amateur
  },
  {
    id: 5,
    title: 'Handiboxe - Sport pour tous',
    date: '2024-08-20',
    summary: 'Développement de la section Handiboxe pour l\'inclusion sportive.',
    description: 'Notre section Handiboxe continue de se développer avec des créneaux adaptés pour les personnes en situation de handicap. Sport et inclusion.',
    image: handiboxe
  },
  {
    id: 6,
    title: 'Formation des éducateurs',
    date: '2024-08-15',
    summary: 'Formation continue de notre équipe d\'éducateurs et coachs.',
    description: 'L\'équipe pédagogique du club suit régulièrement des formations pour maintenir la qualité de l\'encadrement et s\'adapter aux évolutions du sport.',
    image: coach1
  }
];

export default newsItems;
