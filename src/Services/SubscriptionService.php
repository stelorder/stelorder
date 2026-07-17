<?php

namespace Stel\Verifactu\Services;

use Stel\Verifactu\Controllers\DTOs\CreateLocalSubscriptionDto;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Domain\Subscription;

interface SubscriptionService {

    /**
     * Creates a local subscription for the given integration and events.
     *
     * @param CreateLocalSubscriptionDto $dto The data transfer object containing subscription details.
     * @param Integration $integration The integration for which the subscription is being created.
     * @param array $events An array of event names to subscribe to.
     * @return Subscription The created subscription object.
     */
    public function createLocalSubscription(CreateLocalSubscriptionDto $dto, Integration $integration, array $events): Subscription;

    /**
     * Deletes the local subscription and its associated webhooks.
     *
     * @param Subscription $subscription The subscription to be deleted.
     */
    public function deleteLocalSubscription(Subscription $subscription): void;

}