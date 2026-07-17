<?php

namespace Stel\Verifactu\Services\Impl;

use Exception;
use Stel\Verifactu\Controllers\DTOs\CreateLocalSubscriptionDto;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Domain\Subscription;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Services\StelService;
use Stel\Verifactu\Services\SubscriptionService;
use Stel\Verifactu\Services\WCWebhookService;

class WebhookSubscriptionService implements SubscriptionService {

    private static ?WebhookSubscriptionService $instance = null;
    private readonly WCWebhookService $service;

    public static function getInstance(): WebhookSubscriptionService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->service = WCWebhookService::getInstance();
    }

    public function createLocalSubscription(CreateLocalSubscriptionDto $dto, Integration $integration, array $events): Subscription
    {
        $localIds = array();
        foreach ($events as $event) {
            $localWb = $this->service->createWCWebhook(
                StelService::STEL_API_MICROSERVICE_URL . "integrations/{$integration->getIntegrationId()}/events}",
                "{$dto->name} {$event}",
                "{$dto->name}.{$event}",
                get_current_user_id(),
            );
            $localIds[] = $localWb->get_id();
        }
        $result = new Subscription(
            $localIds, // Local IDs will be empty as this subscription is only local
            $dto->externalId, // External ID will be null as this subscription is only local
            $dto->name,
            [],
            []
        );
        $result->setLocalType($dto->type);
        return $result;
    }

    public function deleteLocalSubscription(Subscription $subscription): void
    {
        foreach ($subscription->getLocalIds() as $localId) {
            try {
                $this->service->deleteWCWebhook($localId);
            } catch (Exception $e) {
                Logger::addLog( "Error deleting local webhook with ID {$localId}: " . $e->getMessage() );
            }
        }
    }
}