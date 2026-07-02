import { NAV_ITEMS } from '../constants/adminCopy';

/** Fil d'Ariane standard pour les écrans admin */
export function adminBreadcrumbs(sectionLabel) {
  return [
    { label: NAV_ITEMS.dashboard, to: '/admin/dashboard' },
    { label: sectionLabel },
  ];
}
