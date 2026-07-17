<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Services\InvoiceOrderDetailsService;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderInvoiceOrderDetailsStrategy;

abstract class OrderAdminView {
    protected InvoiceOrderDetailsService $service;
    private ?RenderInvoiceOrderDetailsStrategy $strategy = null;

    public function __construct(InvoiceOrderDetailsService $service, ?RenderInvoiceOrderDetailsStrategy $strategy = null) {
        $this->service = $service;
        $this->strategy = $strategy;
    }

    public function render() {
        $this->renderView($this->strategy);
    }

    /** 
     * @param RenderInvoiceOrderDetailsStrategy|null $strategy An optional strategy to render the fetched data
     */
    protected abstract function renderView(RenderInvoiceOrderDetailsStrategy $strategy): void;
}