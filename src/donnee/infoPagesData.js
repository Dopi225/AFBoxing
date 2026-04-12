import {
  faFistRaised,
  faGraduationCap,
  faHeart,
  faMusic,
  faBrain,
  faWheelchair,
  faUsers,
  faLightbulb,
  faMapMarkerAlt,
  faHome,
} from '@fortawesome/free-solid-svg-icons';

import educativeImg from '../assets/educative.jpg';
import loisirImg from '../assets/loisir.jpg';
import amateurImg from '../assets/amateur.jpg';
import handiboxeImg from '../assets/HandiBoxe.jpg';
import aeroboxeImg from '../assets/aero.jpg';
import therapieImg from '../assets/terapy.jpg';

import socialImg from '../assets/social.jpg';

// Données centralisées des pages /info/:type
export const INFO_PAGES = [
  {
    id: 'educative',
    kind: 'boxing',
    title: 'Boxe éducative',
    eyebrow: '8–17 ans • Technique • Valeurs',
    subtitle:
      "Une pratique sécurisée, sans recherche de KO : apprentissage, confiance en soi et cadre éducatif.",
    icon: faGraduationCap,
    image: educativeImg,
    scheduleActivityName: 'Boxe Éducative',
    meta: {
      age: '8–17 ans',
      equipment: 'Tenue de sport, chaussures propres. Gants prêtés au club.',
      priceKey: 'boxing.educative',
    },
    sections: [
      {
        title: 'Ce que c’est',
        paragraphs: [
          "La boxe éducative permet aux jeunes de découvrir la boxe anglaise dans un cadre progressif. On travaille la posture, les déplacements, la coordination et la maîtrise de soi, avec des mises en situation adaptées (sans brutalité).",
        ],
      },
      {
        title: 'Ce qu’on travaille',
        bullets: [
          "Coordination, équilibre et motricité",
          "Techniques de base (garde, direct, crochet, esquive)",
          "Respect des règles et de l’adversaire",
          "Confiance, discipline, gestion des émotions",
        ],
      },
      {
        title: 'Pour qui ?',
        paragraphs: [
          "Pour les jeunes débutants ou déjà sportifs. Les groupes sont organisés pour garantir un encadrement adapté à l’âge et au niveau.",
        ],
      },
    ],
  },
  {
    id: 'loisir',
    kind: 'boxing',
    title: 'Boxe loisir',
    eyebrow: 'Cardio • Technique • Bien-être',
    subtitle:
      "Se défouler, progresser et transpirer : une boxe accessible, conviviale et adaptée à tous les niveaux.",
    icon: faHeart,
    image: loisirImg,
    scheduleActivityName: 'Boxe Loisir',
    meta: {
      age: 'Ados & adultes',
      equipment: 'Tenue de sport + chaussures. Gants prêtés (ou gants perso).',
      priceKey: 'boxing.loisir',
    },
    sections: [
      {
        title: 'L’esprit',
        paragraphs: [
          "La boxe loisir, c’est la boxe pour le plaisir : apprentissage technique, cardio, renforcement, et une ambiance de groupe motivante. Chacun évolue à son rythme, sans objectif compétition.",
        ],
      },
      {
        title: 'Une séance type',
        bullets: [
          "Échauffement et mobilité",
          "Travail technique (pattes d’ours, sac, shadow)",
          "Circuit cardio / renforcement",
          "Retour au calme et étirements",
        ],
      },
      {
        title: 'Objectif',
        paragraphs: [
          "Bouger, se sentir bien, gagner en condition physique et apprendre les fondamentaux de la boxe anglaise.",
        ],
      },
    ],
  },
  {
    id: 'amateur',
    kind: 'boxing',
    title: 'Boxe amateur',
    eyebrow: 'Performance • Compétition • Encadrement',
    subtitle:
      "Pour les boxeurs engagés : préparation, technique, rigueur et accompagnement vers la compétition.",
    icon: faFistRaised,
    image: amateurImg,
    scheduleActivityName: 'Boxe Amateur',
    meta: {
      age: '16+',
      equipment:
        "Équipement complet recommandé (gants, protège-dents, coquille, bandes).",
      priceKey: 'boxing.amateur',
    },
    sections: [
      {
        title: 'Ce que ça implique',
        paragraphs: [
          "La boxe amateur demande régularité, sérieux et une bonne hygiène de vie. L’entraînement est plus intensif, avec un travail technique avancé et une préparation physique spécifique.",
        ],
      },
      {
        title: 'Préparation',
        bullets: [
          "Technique et stratégie",
          "Condition physique (force, cardio, explosivité)",
          "Sparring contrôlé selon le niveau",
          "Suivi et objectifs compétition",
        ],
      },
    ],
  },
  {
    id: 'handiboxe',
    kind: 'boxing',
    title: 'Handiboxe',
    eyebrow: 'Inclusif • Adapté • Progressif',
    subtitle:
      "Une pratique de boxe adaptée, centrée sur la progression et le plaisir, quel que soit le handicap.",
    icon: faWheelchair,
    image: handiboxeImg,
    scheduleActivityName: 'Handiboxe',
    meta: {
      age: 'Tous âges',
      equipment: 'Matériel adapté et prêt possible selon les besoins.',
      priceKey: 'boxing.handiboxe',
    },
    sections: [
      {
        title: 'Une boxe adaptée',
        paragraphs: [
          "L’handiboxe permet de pratiquer la boxe avec des adaptations (rythme, exercices, matériel). L’encadrement est pensé pour la sécurité, l’autonomie et la confiance.",
        ],
      },
      {
        title: 'Bénéfices',
        bullets: [
          "Coordination et mobilité",
          "Confiance et dépassement de soi",
          "Lien social et inclusion",
          "Bien-être physique et mental",
        ],
      },
    ],
  },
  {
    id: 'aeroboxe',
    kind: 'boxing',
    title: 'Aéroboxe',
    eyebrow: 'Sans contact • Rythme • Cardio',
    subtitle:
      "Enchaînements de boxe sur musique : une séance dynamique, fun et efficace pour le cardio.",
    icon: faMusic,
    image: aeroboxeImg,
    scheduleActivityName: 'Aeroboxe',
    meta: {
      age: 'Tous âges',
      equipment: 'Tenue de sport + chaussures. Pas de contact.',
      priceKey: 'boxing.aeroboxe',
    },
    sections: [
      {
        title: 'Le concept',
        paragraphs: [
          "L’aéroboxe mélange mouvements de boxe et fitness, sur des playlists rythmées. Idéal pour brûler, transpirer et travailler la coordination.",
        ],
      },
      {
        title: 'On y gagne',
        bullets: [
          "Cardio et endurance",
          "Coordination et explosivité",
          "Dépense énergétique élevée",
          "Bonne humeur et motivation",
        ],
      },
    ],
  },
  {
    id: 'therapie',
    kind: 'boxing',
    title: 'Boxe thérapie',
    eyebrow: 'Bien-être • Émotions • Respiration',
    subtitle:
      "Une approche axée sur la gestion du stress et la confiance, avec des exercices de boxe adaptés.",
    icon: faBrain,
    image: therapieImg,
    scheduleActivityName: 'Boxe Thérapie',
    meta: {
      age: 'Ados & adultes',
      equipment: 'Tenue de sport. Matériel prêté possible.',
      priceKey: 'boxing.therapie',
    },
    sections: [
      {
        title: 'Pourquoi ?',
        paragraphs: [
          "La boxe thérapie utilise le mouvement et la concentration pour mieux gérer la pression du quotidien. On combine exercices techniques, respiration et moments de retour au calme.",
        ],
      },
      {
        title: 'Objectifs',
        bullets: [
          "Canaliser l’énergie et les émotions",
          "Travailler la respiration et la posture",
          "Renforcer l’estime de soi",
          "Retrouver du calme et de la clarté",
        ],
      },
    ],
  },

  // Socio-éducatif
  {
    id: 'aide-devoirs',
    kind: 'social',
    title: 'Aide aux devoirs',
    eyebrow: 'Méthode • Confiance • Réussite',
    subtitle:
      "Un temps d’étude encadré après l’école : méthodologie, explications, et un cadre serein pour avancer.",
    icon: faGraduationCap,
    image: socialImg,
    meta: {
      age: '6–16 ans',
      equipment: 'Cahiers & classeurs. Petit matériel possible sur place.',
      priceKey: 'social.periscolaire',
      scheduleText: 'En semaine après l’école (selon calendrier).',
    },
    sections: [
      {
        title: 'Ce que nous faisons',
        paragraphs: [
          "Nous accompagnons les enfants dans leurs devoirs avec une approche bienveillante : relire, expliquer, faire reformuler et organiser le travail. L’objectif est de développer l’autonomie, pas de “faire à la place”.",
        ],
      },
      {
        title: 'Pour les familles',
        bullets: [
          "Cadre régulier et rassurant",
          "Méthode de travail (organisation, priorités)",
          "Valorisation et confiance",
          "Communication facilitée en cas de besoin",
        ],
      },
    ],
  },
  {
    id: 'accompagnement-scolaire',
    kind: 'social',
    title: 'Accompagnement scolaire',
    eyebrow: 'Suivi • Méthodo • Progression',
    subtitle:
      "Un suivi plus approfondi pour les jeunes qui ont besoin d’un coup de pouce durable.",
    icon: faUsers,
    image: socialImg,
    meta: {
      age: '6–18 ans',
      equipment: 'Supports pédagogiques adaptés selon le besoin.',
      priceKey: 'social.periscolaire',
      scheduleText: 'Sur créneaux planifiés (sur rendez-vous).',
    },
    sections: [
      {
        title: 'Un accompagnement dans la durée',
        paragraphs: [
          "Quand les difficultés s’installent, il faut du temps et de la méthode. On aide à consolider les bases, à reprendre confiance et à retrouver de bonnes habitudes de travail.",
        ],
      },
      {
        title: 'Ce qu’on met en place',
        bullets: [
          "Évaluation des besoins",
          "Objectifs simples et mesurables",
          "Méthodologie (lecture, exercices, mémorisation)",
          "Bilan régulier avec la famille",
        ],
      },
    ],
  },
  {
    id: 'orientation',
    kind: 'social',
    title: 'Orientation & projet',
    eyebrow: 'Ateliers • Métiers • Motivation',
    subtitle:
      "Aider les jeunes à clarifier un projet : découvrir des filières, des métiers et se préparer aux démarches.",
    icon: faLightbulb,
    image: socialImg,
    meta: {
      age: '14–25 ans',
      equipment: 'Documentation + outils numériques selon les ateliers.',
      priceKey: 'social.periscolaire',
      scheduleText: 'Ateliers planifiés (périodes scolaires).',
    },
    sections: [
      {
        title: 'Concrètement',
        bullets: [
          "Découverte de métiers et de formations",
          "Aide CV / lettre / candidature",
          "Préparation aux entretiens (simulation)",
          "Organisation des démarches (planning, objectifs)",
        ],
      },
      {
        title: 'Objectif',
        paragraphs: [
          "Donner des repères, créer un déclic et accompagner vers un projet réaliste, étape par étape.",
        ],
      },
    ],
  },
  {
    id: 'sorties-pedagogiques',
    kind: 'social',
    title: 'Sorties pédagogiques',
    eyebrow: 'Culture • Découverte • Ouverture',
    subtitle:
      "Des sorties pour apprendre autrement : musées, nature, lieux de découverte… et surtout vivre une expérience.",
    icon: faMapMarkerAlt,
    image: socialImg,
    meta: {
      age: '6–16 ans',
      equipment: 'Transport organisé selon les sorties.',
      priceKey: 'social.periscolaire',
      scheduleText: 'Vacances scolaires / dates annoncées.',
    },
    sections: [
      {
        title: 'Pourquoi c’est important',
        paragraphs: [
          "Sortir du quotidien, voir, comprendre et échanger : les sorties renforcent la curiosité, la cohésion et l’ouverture.",
        ],
      },
      {
        title: 'Exemples',
        bullets: [
          "Musées, expositions, médiathèque",
          "Parcs naturels, activités de plein air",
          "Découverte d’entreprises ou d’associations",
        ],
      },
    ],
  },
  {
    id: 'sorties-familiales',
    kind: 'social',
    title: 'Sorties familiales',
    eyebrow: 'Partage • Lien • Souvenirs',
    subtitle:
      "Des moments conviviaux pour renforcer les liens entre familles et créer une vraie dynamique de quartier.",
    icon: faHome,
    image: socialImg,
    meta: {
      age: 'Familles',
      equipment: 'Selon l’activité (infos communiquées à l’avance).',
      priceKey: 'social.periscolaire',
      scheduleText: 'Dates ponctuelles annoncées.',
    },
    sections: [
      {
        title: 'L’idée',
        paragraphs: [
          "Partager une sortie, c’est aussi créer du lien. Ces rendez-vous facilitent les échanges, l’entraide et la convivialité.",
        ],
      },
      {
        title: 'Exemples',
        bullets: [
          "Sorties nature, pique-niques",
          "Activités sportives parents-enfants",
          "Visites culturelles",
          "Journées conviviales",
        ],
      },
    ],
  },
];

export const INFO_PAGES_BY_ID = Object.fromEntries(INFO_PAGES.map((p) => [p.id, p]));

export function getInfoPageById(id) {
  return INFO_PAGES_BY_ID[id] || null;
}

export function listInfoPagesByKind(kind) {
  return INFO_PAGES.filter((p) => p.kind === kind);
}


