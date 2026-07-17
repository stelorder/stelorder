<?php

namespace Stel\Verifactu\Controllers\DTOs;

use InvalidArgumentException;

class IntegrationDTO {
    private string $userId;
    private string $integrationKey;


    public function __construct(string $userId, string $integrationKey) {
        if (empty($userId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $userId)) {
            throw new InvalidArgumentException('User ID must not be empty and must be a valid UUID.');
        }
        if (empty($integrationKey)) {
            throw new InvalidArgumentException('Integration key must not be empty.');
        }
        $this->userId = $userId;
        $this->integrationKey = $integrationKey;
    }

    public function getUserId(): string {
        return $this->userId;
    }

    public function getIntegrationKey(): string {
        return $this->integrationKey;
    }
}