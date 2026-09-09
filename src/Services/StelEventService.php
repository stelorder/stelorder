<?php

namespace Stel\Verifactu\Services;

use Exception;
use Stel\Verifactu\Domain\EventActionType;
use Stel\Verifactu\Domain\EventType;
use Stel\Verifactu\Repositories\IntegrationRepository;

class StelEventService {
    private static ?StelEventService $instance = null;
    private IntegrationRepository $integrationRepo;
    private StelService $service;
    private function __construct() {
        $this->integrationRepo = IntegrationRepository::getInstance();
        $this->service = StelService::getInstance();
    }

    public static function getInstance(): StelEventService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * @param string $entityTopic
     * @param array $eventData
     * @return string event published ID
     * @throws Exception
     */
    public function sendPublishEvent(string $entityTopic, EventActionType $actionType, array $eventData ): string {
        $integration = $this->integrationRepo->get();
        if ($integration === null) {
            throw new Exception("Integration not found. Please ensure the integration is set up correctly.");
        }
        $eventId = $this->service->publishEvent(
            $integration->getIntegrationId(),
            $integration->getToken(),
            $entityTopic,
            EventType::DEFERRED_PUBLISH,
            $actionType,
            $eventData
        );
        if ($eventId === null) {
            throw new Exception("Could not publish event.");
        }
        return $eventId;
    }

    /**
     * @throws Exception
     */
    public function fetchEventJobs(string $syncEventId): array
    {
        $integration = $this->integrationRepo->get();
        if ($integration === null) {
            throw new Exception("Integration not found. Please ensure the integration is set up correctly.");
        }
        $eventJobs = $this->service->fetchEventJobs(
            $integration->getIntegrationId(),
            $integration->getToken(),
            $syncEventId
        );
        if ($eventJobs === null) {
            throw new Exception("Could not fetch event jobs.");
        }
        return $eventJobs;
    }

}