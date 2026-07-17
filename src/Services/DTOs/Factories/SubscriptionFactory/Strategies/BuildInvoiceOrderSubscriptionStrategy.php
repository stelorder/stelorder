<?php

namespace Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\Strategies;

use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;

class BuildInvoiceOrderSubscriptionStrategy implements BuildSubscriptionStrategy{
    public function build(): SaveWebhookDTO {
        return new SaveWebhookDTO(
            true,
            null,
            null,
            'order',
            [
                'sync_order' => true,
                'sync_order_invoices' => true,
            ]
        );
    }
}