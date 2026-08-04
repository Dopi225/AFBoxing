<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Middlewares\AuthMiddleware;
use PHPUnit\Framework\TestCase;

final class AuthMiddlewareTest extends TestCase
{
    protected function tearDown(): void
    {
        unset(
            $_SERVER['HTTP_AUTHORIZATION'],
            $_SERVER['REDIRECT_HTTP_AUTHORIZATION'],
            $_SERVER['HTTPS_AUTHORIZATION']
        );
        http_response_code(200);
        parent::tearDown();
    }

    public function testMissingBearerReturnsNull(): void
    {
        $m = new AuthMiddleware();
        ob_start();
        $user = $m->handle();
        ob_end_clean();

        self::assertNull($user);
        self::assertSame(401, http_response_code());
    }

    public function testEmptyBearerReturnsNull(): void
    {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ';
        $m = new AuthMiddleware();
        ob_start();
        $user = $m->handle();
        $out = ob_get_clean();

        self::assertNull($user);
        self::assertSame(401, http_response_code());
        self::assertNotSame('', $out);
    }

    public function testMalformedJwtReturnsUnauthorized(): void
    {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer eyJhbGciOiJIUzI1NiJ9.not.valid.signature';
        $m = new AuthMiddleware();
        ob_start();
        $user = $m->handle();
        $out = ob_get_clean();

        self::assertNull($user);
        self::assertSame(401, http_response_code());
        self::assertMatchesRegularExpression('/INVALID_TOKEN|AUTH_|JWT|token/i', $out);
    }

    public function testRoleRequiredRejectsWrongRoleWhenTokenWouldBeValid(): void
    {
        $m = new AuthMiddleware(['admin']);
        ob_start();
        $user = $m->handle();
        ob_end_clean();
        self::assertNull($user);
        self::assertSame(401, http_response_code());
    }
}
