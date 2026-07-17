<?php

namespace Stel\Verifactu\WooCommerce\Views\Orders\Strategies;

use Exception;
use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Domain\InvoiceStatus;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderSingleOrderStrategy;

class RenderMetaBoxStrategy implements RenderSingleOrderStrategy
{

    private const SCRIPT_HANDLE = 'stel-verifactu-metabox';
    private const STYLE_HANDLE  = 'stel-verifactu-metabox-style';

    public function __construct()
    {
        // Registramos antes de add_meta_box
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    public function enqueueAssets(string $hook): void
    {
        // Limitamos la carga a las pantallas de pedido (HPOS y post clásico)
        $order_screen_id = wc_get_page_screen_id('shop-order');
        $current_screen  = get_current_screen();

        if (!$current_screen || $current_screen->id !== $order_screen_id) {
            return;
        }

        // ── CSS ──────────────────────────────────────────────────────────────
        wp_register_style(self::STYLE_HANDLE, false); // 'false' = sin src física
        wp_enqueue_style(self::STYLE_HANDLE);
        wp_add_inline_style(self::STYLE_HANDLE, $this->getInlineStyles());

        // ── JS ───────────────────────────────────────────────────────────────
        wp_register_script(self::SCRIPT_HANDLE, false, [], false, true); // true = footer
        wp_enqueue_script(self::SCRIPT_HANDLE);
        wp_add_inline_script(self::SCRIPT_HANDLE, $this->getInlineScript());
    }

    public function render($fetcher): void
    {
        add_action('add_meta_boxes', function () use ($fetcher) {
            $screen_id = wc_get_page_screen_id('shop-order');
            add_meta_box(
                'stel_verifactu_order_box',
                'Verifactu',
                function ($post) use ($fetcher) {
                    $this->renderMetaBox($post, $fetcher);
                },
                $screen_id,
                'side',
                'high'
            );
        });
    }

    /**
     * @param mixed $post
     * @param callable(array): \Stel\Verifactu\Domain\InvoiceOrderDetails $dataFetcher
     * @return void
     */
    private function renderMetaBox($post, SingleOrderFetcher $fetcher)
    {
        if ($post instanceof \WC_Order) {
            $orderId = $post->get_id();
        } elseif ($post instanceof \WP_Post) {
            $orderId = $post->ID;
            $post = wc_get_order($orderId);
        } else {
            return;
        }

        try {
            $details = $fetcher->fetchData($orderId);
            if ($details instanceof InvoiceOrderDetails) {
                error_log("Details status: " . ($details->getStatus() ? $details->getStatus()->value : 'null'));

                if ($details->getStatus()) {
                    ?>

                    <div class='stel_verifactu_alert'>
                        <span class="dashicons dashicons-warning prevent-link"></span>
                        <span class="message"><?php echo esc_html($details->getStatus()->getMessage()); ?></span>
                    </div>

                    <?php
                }

                if (!empty($details->getPdfUrl() && filter_var($details->getPdfUrl(), FILTER_VALIDATE_URL) !== false)) {
                    ?>
                    <hr>

                    <a href="<?php echo esc_url($details->getPdfUrl()); ?>" target="_blank" class="button button-primary"
                        style="width: 100%; text-align: center; margin-bottom: 8px;">
                        Ver factura
                    </a>

                    <?php
                }

                if (!empty($details->getSalesOrderPdfUrl() && filter_var($details->getSalesOrderPdfUrl(), FILTER_VALIDATE_URL) !== false)) {
                    ?>
                    <a href="<?php echo esc_url($details->getSalesOrderPdfUrl()); ?>" target="_blank" class="button button-primary"
                        style="width: 100%; text-align: center; margin-bottom: 8px;">
                        Ver pedido de venta
                    </a>

                    <?php
                }

                if (!empty($details->getRefunds())) {
                    ?>
                    <header style="margin-top: 15px;">
                        <h2 style="font-weight: bold; margin-bottom: 0px;">Facturas de abono</h2>
                        <hr style="margin-top: 0px;">
                    </header>
                    <?php
                    foreach ($details->getRefunds() as $refund) {
                        $ts = strtotime($refund->getCreatedDate());
                        $iso = $ts ? gmdate('c', $ts) : esc_attr($refund->getCreatedDate());
                        ?>
                        <a href="<?php echo esc_url($refund->getPdfUrl()); ?>" target="_blank" class="button button-secondary"
                            style="width: 100%; text-align: center; margin-bottom: 8px;">
                            Ver abono (<span class="stel-refund-date" data-date="<?php echo esc_attr($iso); ?>">...</span>)
                        </a>
                        <?php
                    }

                    ?>
                    <?php
                }
            }
        } catch (Exception $e) {
        }
    }

    private function getInlineStyles(): string
    {
        return '
            .stel_verifactu_alert {
                margin-top: 20px;
                border-left: 3px solid var(--wc-red);
                padding: 0 10px;
            }
            .stel_verifactu_alert .dashicons {
                color: var(--wc-red);
                vertical-align: middle;
                margin-right: 5px;
            }
            .stel_verifactu_alert .message {
                vertical-align: middle;
            }
        ';
    }

    private function getInlineScript(): string
    {
        return '
            function formatRefundDates() {
                document.querySelectorAll(
                    ".stel_verifactu_alert, .stel-refunds .stel-refund-date, .stel-refund-date"
                ).forEach(function (el) {
                    var dateStr = el.dataset.date;
                    if (!dateStr) return;
                    var d = new Date(dateStr);
                    if (isNaN(d)) { el.textContent = dateStr; return; }
                    el.textContent = d.toLocaleDateString(
                        navigator.language || navigator.userLanguage,
                        { year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit" }
                    );
                });
            }
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", formatRefundDates);
            } else {
                formatRefundDates();
            }
        ';
    }

}