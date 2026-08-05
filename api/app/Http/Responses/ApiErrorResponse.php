<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class ApiErrorResponse
{
    public function fromException(Throwable $exception): JsonResponse
    {
        return match (true) {
            $exception instanceof ValidationException => $this->validationError($exception),
            $exception instanceof AuthenticationException => $this->authenticationError($exception),
            $exception instanceof ModelNotFoundException => $this->notFoundError($exception),
            $exception instanceof NotFoundHttpException => $this->notFoundError($exception),
            $exception instanceof HttpException => $this->httpError($exception),
            $exception instanceof \DomainException => $this->domainError($exception),
            default => $this->serverError($exception),
        };
    }

    private function validationError(ValidationException $exception): JsonResponse
    {
        return response()->json([
            'message' => 'Os dados fornecidos são inválidos.',
            'errors' => $exception->errors(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function authenticationError(AuthenticationException $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage() ?: 'Não autenticado.',
        ], Response::HTTP_UNAUTHORIZED);
    }

    private function notFoundError(Throwable $exception): JsonResponse
    {
        return response()->json([
            'message' => 'Recurso não encontrado.',
        ], Response::HTTP_NOT_FOUND);
    }

    private function httpError(HttpException $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage() ?: 'Erro na requisição.',
        ], $exception->getStatusCode());
    }

    private function domainError(\DomainException $exception): JsonResponse
    {
        return response()->json([
            'message' => $exception->getMessage(),
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function serverError(Throwable $exception): JsonResponse
    {
        // Log the error
        report($exception);

        $message = config('app.debug')
            ? $exception->getMessage()
            : 'Erro interno do servidor.';

        $response = [
            'message' => $message,
        ];

        if (config('app.debug')) {
            $response['exception'] = get_class($exception);
            $response['file'] = $exception->getFile();
            $response['line'] = $exception->getLine();
            $response['trace'] = collect($exception->getTrace())
                ->take(10)
                ->map(fn ($item) => [
                    'file' => $item['file'] ?? null,
                    'line' => $item['line'] ?? null,
                    'function' => $item['function'] ?? null,
                    'class' => $item['class'] ?? null,
                ])
                ->toArray();
        }

        return response()->json($response, Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
