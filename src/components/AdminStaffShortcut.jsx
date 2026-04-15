import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminStaffShortcut.scss';

/**
 * Accès discret pour l’équipe :
 * - Raccourci clavier : Ctrl+Shift+L (L = login)
 * - Zone tactile discrète : coin bas-droit (presque invisible), focus au clavier plus visible
 */
export default function AdminStaffShortcut() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        navigate('/admin/login');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <Link
      to="/admin/login"
      className="admin-staff-shortcut"
      aria-label="Connexion équipe"
      title="Connexion équipe (raccourci : Ctrl+Shift+L)"
    />
  );
}
