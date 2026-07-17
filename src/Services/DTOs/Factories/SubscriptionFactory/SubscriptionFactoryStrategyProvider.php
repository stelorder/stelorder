<?php

namespace Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory;

use Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\Strategies\BuildInvoiceOrderSubscriptionStrategy;

interface SubscriptionFactoryStrategyProvider {
    public function provideSubscriptionFactoryStrategy(): BuildInvoiceOrderSubscriptionStrategy;
}
