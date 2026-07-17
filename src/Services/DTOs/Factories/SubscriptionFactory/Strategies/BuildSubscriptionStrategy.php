<?php

namespace Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\Strategies;

use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;


interface BuildSubscriptionStrategy {
    public function build(): SaveWebhookDTO;
}