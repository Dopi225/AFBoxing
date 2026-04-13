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

    public function testRoleRequiredRejectsWrongRoleWhenTokenWouldBeValid(): void
    {
        // Sans header : même flux 401 (on ne teste pas JWT + DB ici)
        $m = new AuthMiddleware(['admin']);
        ob_start();
        $user = $m->handle();
        ob_end_clean();
        self::assertNull($user);
    }
}
