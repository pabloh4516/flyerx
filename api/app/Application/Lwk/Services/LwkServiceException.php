<?php

declare(strict_types=1);

namespace App\Application\Lwk\Services;

use Exception;

/**
 * Exception para erros do microserviço LWK.
 */
class LwkServiceException extends Exception
{
    public function __construct(
        string $message,
        public readonly int $httpStatusCode = 0,
    ) {
        parent::__construct($message, $httpStatusCode);
    }
}
