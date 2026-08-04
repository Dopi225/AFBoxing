<?php

declare(strict_types=1);

namespace AFBoxing\Tests;

use AFBoxing\Core\Router;
use AFBoxing\Middlewares\AuthMiddleware;
use AFBoxing\Middlewares\AuthMiddlewareInterface;
use PHPUnit\Framework\TestCase;

final class ProtectedRouteAuthTest extends TestCase
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

    public function testProtectedPostRouteRejectsMissingToken(): void
    {
        $router = new Router();
        $router->post('/api/secure', [PingController::class, 'ping'])
            ->middleware(new AuthMiddleware());

        ob_start();
        $router->dispatch('POST', '/api/secure');
        $out = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertStringContainsString('AUTH_HEADER_MISSING', $out);
    }

    public function testProtectedRouteRejectsInvalidBearer(): void
    {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer not-a-valid-jwt';

        $router = new Router();
        $router->get('/api/secure', [PingController::class, 'ping'])
            ->middleware(new AuthMiddleware());

        ob_start();
        $router->dispatch('GET', '/api/secure');
        $out = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertNotSame('', $out);
    }

    public function testCustomMiddlewareCanDenyAccess(): void
    {
        $deny = new class () implements AuthMiddlewareInterface {
            public function handle(): ?array
            {
                http_response_code(401);
                header('Content-Type: application/json');
                echo json_encode(['error' => ['code' => 'AUTH_DENIED', 'message' => 'denied']]);
                return null;
            }
        };

        $router = new Router();
        $router->get('/api/secure', [PingController::class, 'ping'])->middleware($deny);

        ob_start();
        $router->dispatch('GET', '/api/secure');
        $out = ob_get_clean();

        self::assertSame(401, http_response_code());
        self::assertStringContainsString('AUTH_DENIED', $out);
        self::assertStringNotContainsString('"ok":true', $out);
    }
}
