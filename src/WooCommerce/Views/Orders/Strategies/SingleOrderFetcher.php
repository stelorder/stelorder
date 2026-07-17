<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

use Stel\Verifactu\Domain\InvoiceOrderDetails;

interface SingleOrderFetcher {
    public function fetchData(int $orderId): InvoiceOrderDetails;
}