<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use PHPUnit\Framework\TestCase;

final class CorsConfigTest extends TestCase
{
    public function testProductionRejectsUnknownOriginInSubprocess(): void
    {
        $php = PHP_BINARY;
        $cors = dirname(__DIR__) . '/config/cors.php';
        $script = <<<'PHP'
<?php
$_ENV['APP_ENV'] = 'production';
$_ENV['CORS_ALLOWED_ORIGINS'] = 'https://afboxingclub86.com';
$_SERVER['HTTP_ORIGIN'] = 'https://evil.example';
$_SERVER['REQUEST_METHOD'] = 'GET';
require $argv[1];
afboxing_apply_cors();
echo 'REACHED_OK';
PHP;
        $tmp = tempnam(sys_get_temp_dir(), 'cors');
        file_put_contents($tmp, $script);
        $cmd = escapeshellarg($php) . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($cors) . ' 2>&1';
        $output = [];
        exec($cmd, $output);
        @unlink($tmp);
        $joined = implode("\n", $output);
        self::assertStringNotContainsString('REACHED_OK', $joined);
        self::assertStringContainsString('Origin not allowed', $joined);
    }

    public function testDevelopmentAllowsListedLocalOrigin(): void
    {
        $php = PHP_BINARY;
        $cors = dirname(__DIR__) . '/config/cors.php';
        $script = <<<'PHP'
<?php
$_ENV['APP_ENV'] = 'development';
$_ENV['CORS_ALLOWED_ORIGINS'] = 'http://localhost:5173';
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:5173';
$_SERVER['REQUEST_METHOD'] = 'GET';
require $argv[1];
afboxing_apply_cors();
echo 'REACHED_OK';
PHP;
        $tmp = tempnam(sys_get_temp_dir(), 'cors');
        file_put_contents($tmp, $script);
        $cmd = escapeshellarg($php) . ' ' . escapeshellarg($tmp) . ' ' . escapeshellarg($cors) . ' 2>&1';
        $output = [];
        exec($cmd, $output);
        @unlink($tmp);
        self::assertStringContainsString('REACHED_OK', implode("\n", $output));
    }
}
