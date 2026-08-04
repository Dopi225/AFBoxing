<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Season;

class SeasonController extends BaseController
{
    use LogsActivity;

    private Season $seasons;

    public function __construct()
    {
        $this->seasons = new Season(afboxing_db());
    }

    public function index(array $params): void
    {
        $this->json($this->seasons->all());
    }

    public function store(array $params): void
    {
        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['label', 'startsOn', 'endsOn', 'copyFromSeasonId']);

        if (empty($errors['label']) && isset($data['label'])) {
            if (!$this->validateLength((string)$data['label'], 4, 100)) {
                $errors['label'] = 'Le libellé de la saison doit contenir entre 4 et 100 caractères.';
            }
        }

        if (empty($errors['startsOn']) && isset($data['startsOn']) && !$this->validateDate((string)$data['startsOn'])) {
            $errors['startsOn'] = 'Indiquez une date de début valide (ex. : 2026-09-01).';
        }

        if (empty($errors['endsOn']) && isset($data['endsOn']) && !$this->validateDate((string)$data['endsOn'])) {
            $errors['endsOn'] = 'Indiquez une date de fin valide (ex. : 2027-08-31).';
        }

        if (
            empty($errors['startsOn'])
            && empty($errors['endsOn'])
            && isset($data['startsOn'], $data['endsOn'])
            && (string)$data['endsOn'] < (string)$data['startsOn']
        ) {
            $errors['endsOn'] = 'La date de fin doit être après la date de début.';
        }

        $copyFrom = (int)($data['copyFromSeasonId'] ?? 0);
        if ($copyFrom < 1) {
            $errors['copyFromSeasonId'] = 'Choisissez la saison dont les tarifs doivent être copiés.';
        } elseif (!$this->seasons->find($copyFrom)) {
            $errors['copyFromSeasonId'] = 'La saison à copier est introuvable.';
        }

        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        try {
            $result = $this->seasons->createWithCopy(
                $this->sanitizeString((string)$data['label'], 100),
                (string)$data['startsOn'],
                (string)$data['endsOn'],
                $copyFrom
            );
            $this->logActivity(
                $params,
                'create',
                'season',
                'Saison « ' . ($result['season']['label'] ?? '') . ' » créée (' . $result['copiedCount'] . ' tarifs copiés)'
            );
            $this->json([
                'message' => sprintf(
                    'Saison créée. %d tarif(s) copié(s).',
                    $result['copiedCount']
                ),
                'season' => $result['season'],
                'copiedCount' => $result['copiedCount'],
            ], 201);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError('INVALID_SEASON', $e->getMessage(), 422);
        } catch (\Throwable $e) {
            error_log('[afboxing] season create: ' . $e->getMessage());
            $this->jsonError('SEASON_CREATE_FAILED', 'Impossible de créer la saison. Réessayez.', 500);
        }
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->seasons->find($id);
        if (!$existing) {
            $this->json(['error' => 'Saison introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['label', 'startsOn', 'endsOn']);

        if (empty($errors['label']) && isset($data['label'])) {
            if (!$this->validateLength((string)$data['label'], 4, 100)) {
                $errors['label'] = 'Le libellé de la saison doit contenir entre 4 et 100 caractères.';
            }
        }

        if (empty($errors['startsOn']) && isset($data['startsOn']) && !$this->validateDate((string)$data['startsOn'])) {
            $errors['startsOn'] = 'Indiquez une date de début valide.';
        }

        if (empty($errors['endsOn']) && isset($data['endsOn']) && !$this->validateDate((string)$data['endsOn'])) {
            $errors['endsOn'] = 'Indiquez une date de fin valide.';
        }

        if (
            empty($errors['startsOn'])
            && empty($errors['endsOn'])
            && isset($data['startsOn'], $data['endsOn'])
            && (string)$data['endsOn'] < (string)$data['startsOn']
        ) {
            $errors['endsOn'] = 'La date de fin doit être après la date de début.';
        }

        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $item = $this->seasons->update($id, [
            'label' => $this->sanitizeString((string)$data['label'], 100),
            'startsOn' => (string)$data['startsOn'],
            'endsOn' => (string)$data['endsOn'],
        ]);
        $this->logActivity($params, 'update', 'season', 'Saison « ' . ($data['label'] ?? '') . ' » modifiée');
        $this->json($item);
    }

    public function setCurrent(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $target = $this->seasons->find($id);
        if (!$target) {
            $this->json(['error' => 'Saison introuvable'], 404);
            return;
        }

        if ($target['isCurrent']) {
            $this->json([
                'message' => 'Cette saison est déjà celle affichée sur le site.',
                'season' => $target,
            ]);
            return;
        }

        try {
            $result = $this->seasons->setCurrent($id);
            $prevLabel = $result['previous']['label'] ?? 'précédente';
            $newLabel = $result['season']['label'] ?? '';
            $this->logActivity(
                $params,
                'update',
                'season',
                'Saison affichée : ' . $newLabel . ' (était ' . $prevLabel . ')'
            );
            $this->json([
                'message' => sprintf(
                    'Les tarifs affichés sur le site passent de la saison %s à la saison %s.',
                    $prevLabel,
                    $newLabel
                ),
                'season' => $result['season'],
                'previous' => $result['previous'],
            ]);
        } catch (\Throwable $e) {
            error_log('[afboxing] set-current season: ' . $e->getMessage());
            $this->jsonError(
                'SET_CURRENT_FAILED',
                'Impossible de changer la saison affichée sur le site. Réessayez.',
                500
            );
        }
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->seasons->find($id);
        if (!$existing) {
            $this->json(['error' => 'Saison introuvable'], 404);
            return;
        }

        try {
            $result = $this->seasons->delete($id);
            $this->logActivity(
                $params,
                'delete',
                'season',
                'Saison « ' . $result['label'] . ' » supprimée (' . $result['deletedPricingCount'] . ' tarif(s))'
            );
            $this->json([
                'message' => sprintf(
                    'Saison « %s » supprimée (%d tarif(s) associés).',
                    $result['label'],
                    $result['deletedPricingCount']
                ),
                'deletedId' => $result['deletedId'],
                'deletedPricingCount' => $result['deletedPricingCount'],
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError('SEASON_DELETE_FORBIDDEN', $e->getMessage(), 422);
        } catch (\Throwable $e) {
            error_log('[afboxing] season delete: ' . $e->getMessage());
            $this->jsonError('SEASON_DELETE_FAILED', 'Impossible de supprimer la saison. Réessayez.', 500);
        }
    }
}
