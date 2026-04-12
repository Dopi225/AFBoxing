<?php

declare(strict_types=1);

namespace AFBoxing\Core;

/**
 * Logger simple pour l'application.
 * En production, utilisez Monolog (déjà installé) pour un logging plus avancé.
 */
class Logger
{
    private string $logDir;
    private string $logFile;

    public function __construct(string $logFile = 'app.log')
    {
        $backendRoot = dirname(__DIR__, 2);
        $this->logDir = $backendRoot . '/storage/logs';
        if (!is_dir($this->logDir)) {
            @mkdir($this->logDir, 0775, true);
        }
        $this->logFile = $this->logDir . '/' . $logFile;
    }

    /**
     * Log un message avec niveau et contexte.
     */
    public function log(string $level, string $message, array $context = []): void
    {
        $timestamp = date('c');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        $logLine = "[{$timestamp}] [{$level}] {$message}{$contextStr}" . PHP_EOL;
        
        @file_put_contents($this->logFile, $logLine, FILE_APPEND | LOCK_EX);
    }

    public function info(string $message, array $context = []): void
    {
        $this->log('INFO', $message, $context);
    }

    public function warning(string $message, array $context = []): void
    {
        $this->log('WARNING', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->log('ERROR', $message, $context);
    }

    public function debug(string $message, array $context = []): void
    {
        $isDev = ($_ENV['APP_ENV'] ?? getenv('APP_ENV')) !== 'production';
        if ($isDev) {
            $this->log('DEBUG', $message, $context);
        }
    }
}

