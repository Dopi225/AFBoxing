/**
 * Journalisation des actions admin.
 * L’historique est désormais écrit côté serveur (JWT) pour chaque CRUD.
 * Cette fonction reste disponible pour compatibilité ; elle ne double plus les entrées.
 */
export const logActivity = async () => {
  // no-op : logging backend via LogsActivity
};
