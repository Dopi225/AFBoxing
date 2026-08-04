<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Activity;
use AFBoxing\Models\Schedule;

class ScheduleController extends BaseController
{
    use LogsActivity;

    private Schedule $schedule;

    private Activity $activity;

    public function __construct()
    {
        $this->schedule = new Schedule(afboxing_db());
        $this->activity = new Activity(afboxing_db());
    }

    /**
     * @param array<string,mixed> $row
     * @return array{day:string,time:string,activity:string,level:?string,activity_id:?string}|array{error:string}
     */
    private function normalizeScheduleRow(array $row): array
    {
        $activityId = $row['activityId'] ?? $row['activity_id'] ?? null;
        if (is_string($activityId)) {
            $activityId = trim($activityId) !== '' ? trim($activityId) : null;
        } else {
            $activityId = null;
        }

        if ($activityId !== null) {
            $act = $this->activity->find($activityId);
            if (!$act || empty($act['enabled'])) {
                return ['error' => 'Activité introuvable ou désactivée (planning).'];
            }
            $label = trim((string)($act['scheduleActivityName'] ?: $act['title']));
            if ($label === '') {
                return ['error' => 'Renseignez le « nom pour le planning » sur l’activité ou son titre.'];
            }

            return [
                'day' => (string)$row['day'],
                'time' => (string)$row['time'],
                'activity' => $label,
                'level' => isset($row['level']) && $row['level'] !== '' ? (string)$row['level'] : null,
                'activity_id' => $activityId,
            ];
        }

        if (empty($row['activity']) || !is_string($row['activity'])) {
            return ['error' => 'Le nom d’activité (créneau) est requis.'];
        }

        return [
            'day' => (string)$row['day'],
            'time' => (string)$row['time'],
            'activity' => (string)$row['activity'],
            'level' => isset($row['level']) && $row['level'] !== '' ? (string)$row['level'] : null,
            'activity_id' => null,
        ];
    }

    /** Créneau lié à une activité en base (activityId) ou libellé libre (activity). */
    private function rowReferencesActivity(array $row): bool
    {
        $id = $row['activityId'] ?? $row['activity_id'] ?? null;
        if (is_string($id) && trim($id) !== '') {
            return true;
        }

        return !empty($row['activity']) && is_string($row['activity']) && trim($row['activity']) !== '';
    }

    private function rowHasActivityId(array $row): bool
    {
        $id = $row['activityId'] ?? $row['activity_id'] ?? null;

        return is_string($id) && trim($id) !== '';
    }

    public function index(array $params): void
    {
        $items = $this->schedule->all();
        $this->json($items);
    }

    public function store(array $params): void
    {
        $body = $params['_body'] ?? [];

        // Mode "bulk" : tableau JSON (y compris vide) = remplacement atomique du planning
        if (is_array($body) && array_is_list($body)) {
            if (count($body) > 200) {
                $this->json(['error' => 'Trop d\'éléments (maximum 200)'], 422);
                return;
            }

            $errors = [];
            $sanitizedRows = [];
            foreach ($body as $index => $row) {
                $rowErrors = $this->validateRequired($row, ['day', 'time']);
                if (!$this->rowReferencesActivity($row)) {
                    $rowErrors['activity'] = 'Sélectionnez une activité du club ou saisissez un nom de créneau.';
                }

                if (empty($rowErrors['day']) && isset($row['day'])) {
                    $validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                    if (!in_array($row['day'], $validDays, true)) {
                        $rowErrors['day'] = 'Jour invalide.';
                    }
                }

                if (empty($rowErrors['time']) && isset($row['time'])) {
                    if (!$this->validateLength($row['time'], 1, 50)) {
                        $rowErrors['time'] = 'Format d\'horaire invalide.';
                    }
                }

                if (empty($rowErrors['activity']) && isset($row['activity']) && !$this->rowHasActivityId($row)) {
                    if (!$this->validateLength($row['activity'], 2, 100)) {
                        $rowErrors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
                    }
                }

                if ($rowErrors) {
                    $errors["item_{$index}"] = $rowErrors;
                    continue;
                }

                $normalized = $this->normalizeScheduleRow($row);
                if (isset($normalized['error'])) {
                    $errors["item_{$index}"] = ['activity' => $normalized['error']];
                    continue;
                }

                $sanitizedRows[] = [
                    'day' => $this->sanitizeString($normalized['day'], 20),
                    'time' => $this->sanitizeString($normalized['time'], 50),
                    'activity' => $this->sanitizeString($normalized['activity'], 100),
                    'level' => isset($normalized['level']) ? $this->sanitizeString($normalized['level'], 100) : null,
                    'activity_id' => $normalized['activity_id'] ?? null,
                ];
            }

            if (!empty($errors)) {
                // Aucune écriture : le planning existant est conservé
                $this->json(['errors' => $errors], 422);
                return;
            }

            try {
                $created = $this->schedule->replaceAll($sanitizedRows);
                $this->logActivity(
                    $params,
                    'update',
                    'schedule',
                    'Planning enregistré (' . count($created) . ' créneau' . (count($created) > 1 ? 'x' : '') . ')'
                );
                $this->json($created, 201);
            } catch (\Throwable $e) {
                error_log('[afboxing] schedule bulk replace: ' . $e->getMessage());
                $this->jsonError('SCHEDULE_SAVE_FAILED', 'Impossible d\'enregistrer le planning. Réessayez.', 500);
            }
            return;
        }

        // Mode unitaire
        $data = $body;
        $errors = $this->validateRequired($data, ['day', 'time']);
        if (!$this->rowReferencesActivity($data)) {
            $errors['activity'] = 'Sélectionnez une activité du club ou saisissez un nom de créneau.';
        }

        // Validation supplémentaire
        if (empty($errors['day']) && isset($data['day'])) {
            $validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            if (!in_array($data['day'], $validDays, true)) {
                $errors['day'] = 'Jour invalide.';
            }
        }
        
        if (empty($errors['time']) && isset($data['time'])) {
            if (!$this->validateLength($data['time'], 1, 50)) {
                $errors['time'] = 'Format d\'horaire invalide.';
            }
        }
        
        if (empty($errors['activity']) && isset($data['activity']) && !$this->rowHasActivityId($data)) {
            if (!$this->validateLength($data['activity'], 2, 100)) {
                $errors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $normalized = $this->normalizeScheduleRow($data);
        if (isset($normalized['error'])) {
            $this->json(['errors' => ['activity' => $normalized['error']]], 422);
            return;
        }

        $sanitized = [
            'day' => $this->sanitizeString($normalized['day'], 20),
            'time' => $this->sanitizeString($normalized['time'], 50),
            'activity' => $this->sanitizeString($normalized['activity'], 100),
            'level' => isset($normalized['level']) ? $this->sanitizeString($normalized['level'], 100) : null,
            'activity_id' => $normalized['activity_id'] ?? null,
        ];
        
        $item = $this->schedule->create($sanitized);
        $this->logActivity($params, 'create', 'schedule', 'Créneau ajouté : ' . $sanitized['day'] . ' ' . $sanitized['time']);
        $this->json($item, 201);
    }

    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->schedule->find($id);
        if (!$existing) {
            $this->json(['error' => 'Créneau introuvable'], 404);
            return;
        }

        $data = $params['_body'] ?? [];
        $errors = $this->validateRequired($data, ['day', 'time']);
        if (!$this->rowReferencesActivity($data)) {
            $errors['activity'] = 'Sélectionnez une activité du club ou saisissez un nom de créneau.';
        }

        // Validation supplémentaire
        if (empty($errors['day']) && isset($data['day'])) {
            $validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            if (!in_array($data['day'], $validDays, true)) {
                $errors['day'] = 'Jour invalide.';
            }
        }
        
        if (empty($errors['time']) && isset($data['time'])) {
            if (!$this->validateLength($data['time'], 1, 50)) {
                $errors['time'] = 'Format d\'horaire invalide.';
            }
        }
        
        if (empty($errors['activity']) && isset($data['activity']) && !$this->rowHasActivityId($data)) {
            if (!$this->validateLength($data['activity'], 2, 100)) {
                $errors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        $normalized = $this->normalizeScheduleRow($data);
        if (isset($normalized['error'])) {
            $this->json(['errors' => ['activity' => $normalized['error']]], 422);
            return;
        }

        $sanitized = [
            'day' => $this->sanitizeString($normalized['day'], 20),
            'time' => $this->sanitizeString($normalized['time'], 50),
            'activity' => $this->sanitizeString($normalized['activity'], 100),
            'level' => isset($normalized['level']) ? $this->sanitizeString($normalized['level'], 100) : null,
            'activity_id' => $normalized['activity_id'] ?? null,
        ];

        $item = $this->schedule->update($id, $sanitized);
        $this->logActivity($params, 'update', 'schedule', 'Créneau modifié : ' . $sanitized['day'] . ' ' . $sanitized['time']);
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $existing = $this->schedule->find($id);
        if (!$existing) {
            $this->json(['error' => 'Créneau introuvable'], 404);
            return;
        }
        $this->schedule->delete($id);
        $this->logActivity($params, 'delete', 'schedule', 'Créneau supprimé : ' . ($existing['day'] ?? '') . ' ' . ($existing['time'] ?? ''));
        $this->json(['message' => 'Créneau supprimé.']);
    }
}


