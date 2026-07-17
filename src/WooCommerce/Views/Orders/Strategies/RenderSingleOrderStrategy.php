<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

/**
 * @extends RenderInvoiceOrderDetailsStrategy<SingleOrderFetcher>
 */
interface RenderSingleOrderStrategy extends RenderInvoiceOrderDetailsStrategy {
    
    /**
     * @param SingleOrderFetcher $fetcher
     */
    public function render($fetcher): void;
}