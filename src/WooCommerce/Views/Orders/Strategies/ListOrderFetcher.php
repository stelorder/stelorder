<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use WC_Order;

interface ListOrderFetcher {
    public function fetchData(int | WC_Order $order): InvoiceOrderDetails;
}