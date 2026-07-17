<?php

namespace Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory;

use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;


class SubscriptionFactory {
    private static ?SubscriptionFactory $instance = null;

    private function __construct() {
        // Private constructor to prevent instantiation
    }

    public static function getInstance(): SubscriptionFactory {
        if (self::$instance === null) {
            self::$instance = new SubscriptionFactory();
        }
        return self::$instance;
    }

    public function createSubscription(SubscriptionType $type): SaveWebhookDTO {
        return $type->provideSubscriptionFactoryStrategy()->build();
    }
}