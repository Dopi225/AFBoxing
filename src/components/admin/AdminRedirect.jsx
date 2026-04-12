import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiService';

const AdminRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  return null;
};

export default AdminRedirect;

