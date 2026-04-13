<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Réponses d'erreur JSON homogènes : { "error": { "code", "message", "details?" } }.
 */
final class JsonErrorResponse
{
    /**
     * @param array<string, mixed>|null $details
     */
    public static function send(int $httpStatus, string $code, string $message, ?array $details = null): void
    {
        http_response_code($httpStatus);
        header('Content-Type: application/json; charset=utf-8');
        $payload = [
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];
        if ($details !== null && $details !== []) {
            $payload['error']['details'] = $details;
        }
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}
