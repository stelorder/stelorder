<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

/**
 * @template T
 */
interface RenderInvoiceOrderDetailsStrategy {

    /** 
     * Renders the InvoiceOrderDetails fetched by the provided callable
     * 
     * @param T $fetcher a functional interface thats provides the necesary data to render the view.
     */
    // @phpstan-ignore-line
    public function render($fetcher): void;

}