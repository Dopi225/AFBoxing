import { activityLogApi } from '../services/apiService';

// Fonction utilitaire pour enregistrer une action dans l'historique
export const logActivity = async (action, entity, description, user = 'Admin') => {
  try {
    await activityLogApi.create({
      action,
      entity,
      description,
      user
    });
  } catch (err) {
    // Ne pas bloquer l'application si l'enregistrement de log échoue
    console.error('Error logging activity:', err);
  }
};

