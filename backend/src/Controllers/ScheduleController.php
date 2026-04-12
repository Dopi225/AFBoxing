<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

use AFBoxing\Models\Schedule;

class ScheduleController extends BaseController
{
    private Schedule $schedule;

    public function __construct()
    {
        $this->schedule = new Schedule(afboxing_db());
    }

    public function index(array $params): void
    {
        $items = $this->schedule->all();
        $this->json($items);
    }

    public function store(array $params): void
    {
        $body = $params['_body'] ?? [];

        // Mode "bulk" : on remplace tout le planning
        if (is_array($body) && isset($body[0]) && is_array($body[0])) {
            // Validation globale : limite le nombre d'éléments pour éviter les abus
            if (count($body) > 200) {
                $this->json(['error' => 'Trop d\'éléments (maximum 200)'], 422);
                return;
            }

            // On vide tout
            $all = $this->schedule->all();
            foreach ($all as $row) {
                $this->schedule->delete((int)$row['id']);
            }

            $created = [];
            $errors = [];
            foreach ($body as $index => $row) {
                $rowErrors = $this->validateRequired($row, ['day', 'time', 'activity']);
                
                // Validation supplémentaire
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
                
                if (empty($rowErrors['activity']) && isset($row['activity'])) {
                    if (!$this->validateLength($row['activity'], 2, 100)) {
                        $rowErrors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
                    }
                }
                
                if ($rowErrors) {
                    $errors["item_{$index}"] = $rowErrors;
                    continue;
                }
                
                // Sanitization
                $sanitized = [
                    'day' => $this->sanitizeString($row['day'], 20),
                    'time' => $this->sanitizeString($row['time'], 50),
                    'activity' => $this->sanitizeString($row['activity'], 100),
                    'level' => isset($row['level']) ? $this->sanitizeString($row['level'], 100) : null,
                ];
                
                $created[] = $this->schedule->create($sanitized);
            }

            if (!empty($errors)) {
                $this->json(['errors' => $errors, 'created' => $created], 207); // 207 Multi-Status
                return;
            }

            $this->json($created, 201);
            return;
        }

        // Mode unitaire
        $data = $body;
        $errors = $this->validateRequired($data, ['day', 'time', 'activity']);
        
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
        
        if (empty($errors['activity']) && isset($data['activity'])) {
            if (!$this->validateLength($data['activity'], 2, 100)) {
                $errors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }
        
        // Sanitization
        $sanitized = [
            'day' => $this->sanitizeString($data['day'], 20),
            'time' => $this->sanitizeString($data['time'], 50),
            'activity' => $this->sanitizeString($data['activity'], 100),
            'level' => isset($data['level']) ? $this->sanitizeString($data['level'], 100) : null,
        ];
        
        $item = $this->schedule->create($sanitized);
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
        $errors = $this->validateRequired($data, ['day', 'time', 'activity']);
        
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
        
        if (empty($errors['activity']) && isset($data['activity'])) {
            if (!$this->validateLength($data['activity'], 2, 100)) {
                $errors['activity'] = 'L\'activité doit contenir entre 2 et 100 caractères.';
            }
        }
        
        if ($errors) {
            $this->json(['errors' => $errors], 422);
            return;
        }

        // Sanitization
        $sanitized = [
            'day' => $this->sanitizeString($data['day'], 20),
            'time' => $this->sanitizeString($data['time'], 50),
            'activity' => $this->sanitizeString($data['activity'], 100),
            'level' => isset($data['level']) ? $this->sanitizeString($data['level'], 100) : null,
        ];

        $item = $this->schedule->update($id, $sanitized);
        $this->json($item ?? []);
    }

    public function destroy(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $this->schedule->delete($id);
        $this->json(['message' => 'Créneau supprimé.']);
    }
}


