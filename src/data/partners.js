import logoPoitiers from '../assets/LOGOPOITIERS.jpg';
import logoFFBoxe from '../assets/FFBOXE.png';
import logoEkidom from '../assets/ekidom.jpg';

/** Partenaires institutionnels — source unique (footer, home, page /partenaire) */
export const PARTNERS = [
  {
    id: 'poitiers',
    name: 'Ville de Poitiers',
    logo: logoPoitiers,
    href: 'https://poitiers.fr',
    description: "Soutien institutionnel et mise à disposition d'équipements sportifs",
    type: 'Institutionnel',
  },
  {
    id: 'ffboxe',
    name: 'FFBOXE - Nouvelle Aquitaine',
    logo: logoFFBoxe,
    href: 'https://ffboxe.fr',
    description: 'Fédération Française de Boxe — formation et compétitions officielles',
    type: 'Federation',
  },
  {
    id: 'ekidom',
    name: 'Ekidom',
    logo: logoEkidom,
    href: 'https://www.ekidom.fr',
    description: "Partenariat pour l'accompagnement socio-éducatif des jeunes",
    type: 'Social',
  },
];
