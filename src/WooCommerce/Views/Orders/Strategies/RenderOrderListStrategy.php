<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

/**
 * @extends RenderInvoiceOrderDetailsStrategy<ListOrderFetcher>
 */
interface RenderOrderListStrategy extends RenderInvoiceOrderDetailsStrategy {
    
    public function render($fetcher): void;
}