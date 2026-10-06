<?php

namespace Stel\Verifactu\Exceptions;

use DateTimeImmutable;
use DateTimeInterface;
use RuntimeException;
use Throwable;

final class ExternalHttpException extends RuntimeException
{
    private ?string $errorCode;
    private ?string $url;
    private ?string $httpMethod;
    private ?string $type;
    private ?DateTimeImmutable $timestamp;
    private array $details;

    public function __construct(
        string $message = '',
        int $statusCode = 500,
        array $context = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);

        $this->errorCode = $context['code'] ?? null;
        $this->url = $context['url'] ?? null;
        $this->httpMethod = $context['http_method'] ?? null;
        $this->type = $context['type'] ?? null;

        try {
            $this->timestamp = isset($context['timestamp'])
                ? new DateTimeImmutable($context['timestamp'])
                : null;
        } catch (\Exception $e) {
            $this->timestamp = null;
        }

        $this->details = $context['details'] ?? [];
    }

    public function toArray(): array
    {
        return array_filter([
            'status_code' => $this->getCode(),
            'code' => $this->errorCode,
            'url' => $this->url,
            'http_method' => $this->httpMethod,
            'type' => $this->type,
            'timestamp' => $this->timestamp?->format(DateTimeInterface::ATOM),
            'details' => $this->details,
        ], static fn ($value) => $value !== null);
    }

    public function getStatusCode(): int
    {
        return $this->getCode();
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function getHttpMethod(): ?string
    {
        return $this->httpMethod;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function getTimestamp(): ?string
    {
        return $this->timestamp?->format(DateTimeInterface::ATOM);
    }

    /**
     * @return string[]
     */
    public function getDetails(): array
    {
        return $this->details;
    }
}
