<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

/**
 * Méthodes corbeille / restauration partagées par les contrôleurs CRUD.
 */
trait TrashActions
{
    protected function trashList(object $model, string $method = 'trash'): void
    {
        $this->json($model->{$method}());
    }

    protected function restoreItem(object $model, int|string $id, string $idColumn = 'id'): void
    {
        $restored = $model->restore($id);
        if (!$restored) {
            $this->jsonError('NOT_FOUND', 'Élément introuvable dans la corbeille.', 404);
            return;
        }
        $findMethod = $idColumn === 'price_key' ? 'findByKey' : 'find';
        $item = $model->{$findMethod}($id);
        $this->json(['message' => 'Élément restauré.', 'item' => $item]);
    }
}
