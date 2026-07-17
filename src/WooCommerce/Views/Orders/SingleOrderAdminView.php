<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\WooCommerce\Views\Orders;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Services\InvoiceOrderDetailsService;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderSingleOrderStrategy;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\SingleOrderFetcher;

class SingleOrderAdminView extends OrderAdminView
{
    private static SingleOrderAdminView $instance;

    public static function getInstance(RenderSingleOrderStrategy $strategy): SingleOrderAdminView
    {
        if (!isset(self::$instance)) {
            self::$instance = new self($strategy);
        }

        return self::$instance;
    }

    private function __construct(RenderSingleOrderStrategy $strategy)
    {
        parent::__construct(InvoiceOrderDetailsService::getInstance(), $strategy);
        $this->render();
    }

    /**
     * @param RenderSingleOrderStrategy $strategy
     */
    protected function renderView($strategy): void
    {
        $strategy->render(new class($this->service) implements SingleOrderFetcher {
            private InvoiceOrderDetailsService $service;

            public function __construct(InvoiceOrderDetailsService $service) {
                $this->service = $service;
            }

            public function fetchData(int $orderId): InvoiceOrderDetails
            {
                if ($orderId <= 0) {
                    throw new \InvalidArgumentException("Invalid context argument orderId: $orderId");
                }
                return $this->service->getInvoiceOrderDetails($orderId);
            }
        });
    }


}