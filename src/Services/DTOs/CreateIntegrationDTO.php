<?php

namespace Stel\Verifactu\Services\DTOs;

use InvalidArgumentException;

class CreateIntegrationDTO {
    private string $integrationId;
    private string $platformId;
    private string $token;


    public function __construct(string $integrationId, string $platformId, string $token) {
        if (empty($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException('integration ID must not be empty and must be a valid UUID.');
        }
        if (empty($platformId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $platformId)) {
            throw new InvalidArgumentException('platform ID must not be empty and must be a valid UUID.');
        }
        if (empty($token)) {
            throw new InvalidArgumentException('token must not be empty.');
        }
        $this->token = $token;
        $this->integrationId = $integrationId;
        $this->platformId = $platformId;
    }

    public function getToken(): string {
        return $this->token;
    }

    public function getPlatformId(): string {
        return $this->platformId;
    }

    public function getIntegrationId(): string {
        return $this->integrationId;
    }
}