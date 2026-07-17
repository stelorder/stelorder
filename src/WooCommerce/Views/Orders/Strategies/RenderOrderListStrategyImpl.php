<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

use Exception;
use Stel\Verifactu\Domain\InvoiceOrderDetails;
use WC_Order;

class RenderOrderListStrategyImpl implements RenderOrderListStrategy
{
    public function render($fetcher): void
    {
        add_action('manage_woocommerce_page_wc-orders_custom_column', function (string $column, WC_Order $order) use ($fetcher) {
            $this->renderView($column, $order->get_id(), $fetcher);

        }, 10, 2);
        // Legacy order system (WordPress CPT)
        add_action('manage_shop_order_posts_custom_column', function (string $column, int $orderId) use ($fetcher) {
            $this->renderView($column, $orderId, $fetcher);
        }, 10, 2);
    }

    private function renderView(string $column, WC_Order|int $order, ListOrderFetcher $fetcher)
    {
        if ($column === 'order_number') {
            try {
                $details = $fetcher->fetchData($order);
                if (($details instanceof InvoiceOrderDetails) && $details->getStatus()) {
                    ?>
                    <span class="dashicons dashicons-warning prevent-link" title="<?php echo esc_attr($details->getStatus()->getMessage()); ?>" role="img" aria-label="La factura ha sido editada" onclick="event.preventDefault(); event.stopPropagation();"
                        style="margin-right: 5px; vertical-align:middle; color: var(--wc-red);">
                    </span>
                    <?php
                }
            } catch (Exception $e) {
            }
        }
    }
}