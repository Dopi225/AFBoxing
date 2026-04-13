<?php

declare(strict_types=1);

namespace AFBoxing\Controllers;

abstract class BaseController
{
    protected function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Erreur métier / client au format standard (compatible avec le parsing dans apiService.js).
     *
     * @param array<string, mixed>|null $details
     */
    protected function jsonError(string $code, string $message, int $status = 400, ?array $details = null): void
    {
        $body = [
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];
        if ($details !== null && $details !== []) {
            $body['error']['details'] = $details;
        }
        $this->json($body, $status);
    }

    protected function validateRequired(array $data, array $fields): array
    {
        $errors = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                $errors[$field] = 'Ce champ est obligatoire.';
            }
        }
        return $errors;
    }

    /**
     * Valide le format d'un email.
     */
    protected function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Valide le format d'une date (YYYY-MM-DD).
     */
    protected function validateDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Sanitize une chaîne de caractères pour prévenir XSS.
     */
    protected function sanitizeString(string $value, int $maxLength = 10000): string
    {
        $value = trim($value);
        if (mb_strlen($value) > $maxLength) {
            $value = mb_substr($value, 0, $maxLength);
        }
        // On ne fait pas de strip_tags ici car on veut préserver le HTML pour les descriptions
        // La protection XSS se fait côté frontend lors de l'affichage
        return $value;
    }

    /**
     * Valide la longueur d'une chaîne.
     */
    protected function validateLength(string $value, int $min = 1, int $max = 10000): bool
    {
        $length = mb_strlen(trim($value));
        return $length >= $min && $length <= $max;
    }

    /**
     * Valide et sanitize les données d'entrée.
     */
    protected function sanitizeInput(array $data, array $rules): array
    {
        $sanitized = [];
        foreach ($rules as $field => $rule) {
            if (!isset($data[$field])) {
                continue;
            }

            $value = $data[$field];
            
            // Type string par défaut
            if (is_string($value)) {
                $maxLength = $rule['max_length'] ?? 10000;
                $sanitized[$field] = $this->sanitizeString($value, $maxLength);
            } else {
                $sanitized[$field] = $value;
            }
        }
        
        return $sanitized;
    }
}


