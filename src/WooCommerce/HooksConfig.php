<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\WooCommerce;

use Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields;
use Automattic\WooCommerce\Enums\ProductType;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Repositories\IntegrationRepository;
use Stel\Verifactu\WooCommerce\Transformer\Transformers;

use Stel\Verifactu\WooCommerce\Utils\ProductChangeTracker;
use WC_Webhook;
use WP_Error;


class HooksConfig
{

    private static HooksConfig $instance;
    private IntegrationRepository $repository;
    private bool $deactivateProductWebhook = false;

    const STEL_ACTIONS = array(
        "created" => "CREATE",
        "updated" => "UPDATE",
        "deleted" => "DELETE",
    );

    const DEACTIVATE_PRODUCT_ACTIONS = [
        'woocommerce_create_refund',
        'woocommerce_before_save_order_item',
        'woocommerce_before_order_object_save'
    ];

    public static function getInstance(): HooksConfig
    {
        if (!isset(self::$instance)) {
            self::$instance = new HooksConfig();
        }
        return self::$instance;
    }

    private function __construct()
    {
        // Aquí puedes inicializar cualquier cosa que necesites
        $this->repository = IntegrationRepository::getInstance();
        /* ######## CUSTOM HOOKS DE WOOCOMMERCE ######## */
        error_log('Load HooksConfig');

        add_filter('woocommerce_webhook_payload', [$this, 'modificar_payload_webhook_con_topic'], 10, 4);
        add_filter('woocommerce_webhook_http_args', [$this, 'add_bearer_token'], 10, 3);
        // Cuando se vaya a producir la actualización de un pedido desactivamos temporalmente el webhook para evitar que se envíe un webhook con los datos anteriores a la actualización
        $deactivateProductFn = function() {
            $this->deactivateProductWebhook = true;
        };
        foreach (self::DEACTIVATE_PRODUCT_ACTIONS as $action) {
            add_action($action, $deactivateProductFn);
        }
        // Guardamos los cambios antes de que apply_changes() los limpie
        add_action( 'woocommerce_before_product_object_save', function( \WC_Product $product ) {
            if ( ! $product->get_id() ) {
                return;
            }

            $changes = $product->get_changes();

            // ignore variations
           if ( $product->is_type( ProductType::VARIABLE ) ) {
                // Guardamos el ID del producto variable para bloquear los webhooks de sus variaciones
                ProductChangeTracker::trackProductChanges( $product );
           } elseif ( $product->is_type( ProductType::VARIATION ) ) {
                if ( !empty( $changes ) ) {
                    ProductChangeTracker::trackProductChanges( $product );
                }
               ProductChangeTracker::addToBufferId( $product->get_id() );
            }

        });

        // Para evitar que las variaciones de un producto actualizado envíen webhooks por sí mismos, para que se procesen desde el evento
        // del producto variable
        add_filter('woocommerce_webhook_should_deliver', function($should_deliver, WC_Webhook $webhook, $resource) {
			if (!str_contains($webhook->get_topic(), 'product.')) {
                return $should_deliver;
            }

	        $integration = $this->repository->get();

	        if (!isset($integration) || !$this->is_stel_webhook($webhook, $integration)) {
		        return $should_deliver;
	        }

            if ($this->deactivateProductWebhook) {
                return false;
            }
            $emptyProductIds = ProductChangeTracker::pullFromBufferId();

            if ( is_int($resource) && in_array($resource, $emptyProductIds) ) {
                error_log("Blocking webhook for product ID $resource because it has no changes");
                return false;
            }
            return $should_deliver;
        }, 10, 3);


    }

    public function add_bearer_token($http_args, $arg, $webhook_id)
    {
        $webhook = new WC_Webhook($webhook_id);

        $integration = $this->repository->get();


        if (!isset($integration) || !$this->is_stel_webhook($webhook, $integration)) {
            return $http_args;
        }

        // Añadir la cabecera Authorization con el Bearer Token
        $http_args['headers']['Authorization'] = 'Bearer ' . $integration->getToken();
        // Asegurar que el Content-Type sea application/json
        $http_args['headers']['Content-Type'] = 'application/json';

        return $http_args;
    }


    public function modificar_payload_webhook_con_topic($payload, $resource, $resource_id, $webhook_id)
    {
        // Obtener el webhook
        $webhook = new WC_Webhook($webhook_id);
        $integration = $this->repository->get();

        if (!isset($integration) || !$this->is_stel_webhook($webhook, $integration)) {
            error_log('No es un webhook de STEL');
            return $payload;
        }

        $content = explode(".", $webhook->get_topic());
        // Aplicamos la transformación del contenido si el tópico tiene un transformador asociado
        Transformers::getInstance()->transform($content[0], $payload);

        // Añadimos las propiedades del suscriptor al payload si los tiene
        $wbData = $this->getWebhookById($webhook_id, $integration);
        $props = $wbData->getProps();
        if ($wbData && isset($props) && is_array($props) && !empty($props)) {
            // Añadimos las propiedades al payload
            error_log('Adding props to payload');
            $payload = array_merge($payload, $props);

        }
        error_log("printing payload: " . print_r($payload, true));

        // Convertir el payload original en una cadena JSON
        $payload_json = wp_json_encode($payload);
        if ($payload_json === false) {
            throw new \RuntimeException('Error converting payload to JSON: ' . json_last_error_msg());
        }

        // Reemplazar el contenido original por el nuevo array con la cadena JSON
        $payload = array(
            'topic' => "wc.$content[0]",
            'action' => self::STEL_ACTIONS[$content[1]],
            'payload' => $payload_json,
        );

        return $payload;
    }

    private function getWebhookById($webhookId, Integration $integration)
    {
        $search = array_filter($integration->getSubscriptions(), function ($webhook) use ($webhookId) {
            return in_array($webhookId, $webhook->getLocalIds());
        });
        return array_shift($search);
    }

    private function is_stel_webhook(WC_Webhook $webhook, Integration $integration)
    {
        // 1. Comprobamos que el nombre del webhook comience con "STEL"
        $hasStelName = str_starts_with($webhook->get_name(), 'STEL');
        if ($hasStelName) {
            if (!empty($integration->getSubscriptions())) {
                foreach ($integration->getSubscriptions() as $wb) {
                    if (in_array($webhook->get_id(), $wb->getLocalIds())) {
                        return true;
                    }
                }
            }
        }
        return false;

    }



}
