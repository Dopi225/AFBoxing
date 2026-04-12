<?php

declare(strict_types=1);

namespace AFBoxing\Core;

use AFBoxing\Middlewares\AuthMiddlewareInterface;

class Router
{
    /** @var array<int, array<string, mixed>> */
    private array $routes = [];

    public function get(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, callable|array $handler): self
    {
        return $this->addRoute('DELETE', $pattern, $handler);
    }

    private function addRoute(string $method, string $pattern, callable|array $handler): self
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'regex' => $this->convertPatternToRegex($pattern),
            'handler' => $handler,
            'middleware' => null,
        ];

        return $this;
    }

    public function middleware(AuthMiddlewareInterface $middleware): self
    {
        $index = \array_key_last($this->routes);
        if ($index !== null) {
            $this->routes[$index]['middleware'] = $middleware;
        }

        return $this;
    }

    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (!preg_match($route['regex'], $uri, $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (!is_int($key)) {
                    $params[$key] = $value;
                }
            }

            if ($route['middleware'] instanceof AuthMiddlewareInterface) {
                $user = $route['middleware']->handle();
                if ($user === null) {
                    return;
                }
                $params['authUser'] = $user;
            }

            $handler = $route['handler'];

            if (is_array($handler)) {
                [$class, $methodName] = $handler;
                $controller = new $class();
                $handler = [$controller, $methodName];
            }

            $body = file_get_contents('php://input');
            $data = null;
            if (!empty($body)) {
                $data = json_decode($body, true);
            }

            $params['_body'] = $data;

            call_user_func($handler, $params);
            return;
        }

        http_response_code(404);
        echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    }

    private function convertPatternToRegex(string $pattern): string
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $regex . '$#';
    }
}


