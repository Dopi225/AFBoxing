import { Link } from 'react-router-dom';
import './AdminStaffShortcut.scss';

/**
 * Accès discret pour l'équipe depuis le footer public.
 * Cible: usage simple pour le staff sans perturber les visiteurs.
 */
export default function AdminStaffShortcut({ children = 'Tous droits réservés' }) {
  return (
    <Link
      to="/admin/login"
      className="admin-staff-shortcut"
      aria-label="Accès réservé au panneau d'administration"
      title="Accès réservé"
    >
      {children}
    </Link>
  );
}
