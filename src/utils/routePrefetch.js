/**
 * Précharge les chunks lazy au survol des liens pour accélérer la navigation.
 * Les chemins doivent correspondre aux routes définies dans App.jsx.
 */
const loaders = {
  '/': () => import('../components/AssociationDeBoxe'),
  '/association': () => import('../components/AssociationDeBoxe'),
  '/apropos': () => import('../components/Apropos'),
  '/activite': () => import('../components/Activite'),
  '/actualite': () => import('../components/Actualite'),
  '/equipe': () => import('../components/Equipe'),
  '/galerie': () => import('../components/Galerie'),
  '/horaire': () => import('../components/Horaire'),
  '/tarif': () => import('../components/Tarif'),
  '/contact': () => import('../components/Contact'),
  '/partenaire': () => import('../components/Partenaire'),
  '/palmares': () => import('../components/Palmares'),
  '/news': () => import('../components/NewsPage'),
  '/info': () => import('../components/InfoPage')
};

export function prefetchPublicRoute(pathname) {
  if (!pathname || typeof pathname !== 'string') return;
  const base = pathname.split('?')[0] || '/';
  const loader = loaders[base];
  if (loader) {
    void loader();
    return;
  }
  if (base.startsWith('/info/')) {
    void loaders['/info']();
  }
}
