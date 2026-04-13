import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authApi } from '../../services/apiService';

/**
 * Garde les routes /admin/* : présence d’un token (validation serveur dans AdminDashboard).
 */
const AdminAuthGate = () => {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
};

export default AdminAuthGate;
