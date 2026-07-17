<?php

namespace Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory;

use Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\Strategies\BuildInvoiceOrderSubscriptionStrategy;
use Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\SubscriptionFactoryStrategyProvider;

enum SubscriptionType implements SubscriptionFactoryStrategyProvider {
    case INVOICE_ORDER;

    public function provideSubscriptionFactoryStrategy(): BuildInvoiceOrderSubscriptionStrategy {
        return match($this) {
            self::INVOICE_ORDER => new BuildInvoiceOrderSubscriptionStrategy(),
        };
    }
}
