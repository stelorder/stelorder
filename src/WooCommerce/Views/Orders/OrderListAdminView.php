<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\WooCommerce\Views\Orders;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Services\InvoiceOrderDetailsService;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\ListOrderFetcher;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderOrderListStrategy;
use WC_Order;

class OrderListAdminView extends OrderAdminView {
    private static OrderListAdminView $instance;

    public static function getInstance(RenderOrderListStrategy $strategy): OrderListAdminView {
        if ( ! isset( self::$instance ) ) {
            self::$instance = new self($strategy);
        }

        return self::$instance;
    }

    private function __construct(RenderOrderListStrategy $strategy) {
        parent::__construct(InvoiceOrderDetailsService::getInstance(), $strategy);
        $this->render();
    }


    /**
    * @param RenderOrderListStrategy
    */
    protected function renderView($strategy): void {
        $strategy->render(new class($this->service) implements ListOrderFetcher {
            private InvoiceOrderDetailsService $service;
            public function __construct(InvoiceOrderDetailsService $service) {
                $this->service = $service;
            }

            public function fetchData( int | WC_Order $data ): InvoiceOrderDetails {
                
                if ($data instanceof WC_Order) {
                    $orderId = $data->get_id();
                } elseif (is_int($data)) {
                    $orderId = $data;
                } else {
                    throw new \InvalidArgumentException("Invalid context argument type, must be int or WC_Order");
                }

                if (!is_int($orderId) || $orderId <= 0) {
                    throw new \InvalidArgumentException("Invalid context argument orderId: $orderId");
                }

                return $this->service->getInvoiceOrderDetails($orderId);
            }
        });
    }

}