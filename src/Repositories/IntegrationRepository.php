<?php

namespace Stel\Verifactu\Repositories;

use Exception;
use Stel\Verifactu\App;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Domain\Subscription;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Services\WCWebhookService;
use WP_Error;

class IntegrationRepository {
    private const COLLECTION_NAME = App::NAME . '_integration';
    private static ?IntegrationRepository $instance = null; // Instancia única de la clase

    // Constructor privado para evitar la instanciación directa
    private function __construct() {
    }

    // Método para obtener la instancia única
    public static function getInstance(): IntegrationRepository {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // Obtener los datos almacenados

    /**
     * Obtain the stored integration data. But mapping fields of `\Stel\Verifactu\Domain\Subscription` are not loaded.
     * @return Integration|null data or **null** if not is persisted
     */
    public function get(): Integration | null {

        wp_cache_delete(self::COLLECTION_NAME, 'options');
        $integration = get_option(self::COLLECTION_NAME, []);

        if ( empty($integration) ) {
            return null;
        }
        $subscriptions = isset($integration["webhooks"]) && ! empty($integration["webhooks"]) ? array_map(function($webhook) {
            $subscription = new Subscription(
                $webhook["webhookId"],
                $webhook["externalId"],
                $webhook["name"],
                $webhook["props"] ?? array()
            );
            if (isset($webhook["localType"])) {
                $subscription->setLocalType($webhook["localType"]);
            }
            return $subscription;
        }, $integration["webhooks"]) : array();
        return new Integration(
            $integration["integrationId"],
            $integration["token"],
            $integration["platformId"],
            $subscriptions
        );
    }

    // Guardar datos en la opción

    /**
     * Save the integration data.
     * @param \Stel\Verifactu\Domain\Integration $integration data to be saved. `Subscription` mapping fields will not be persisted.
     * @return bool if the data was saved successfully
     */
    public function save(Integration $integration) {
        if ( ! $integration instanceof Integration) {
            return false;
        }
        $platformId = $integration->getPlatformId();
        $integratonId = $integration->getIntegrationId();

        $subscriptions = $integration->getSubscriptions();
        $webhooks = array();
        foreach ($subscriptions as $webhook) {
            $wb = array(
                "name"=> $webhook->getName(),
                "webhookId"=> $webhook->getLocalIds(),
                "externalId"=> $webhook->getExternalId(),
                "props" => $webhook->getProps() ?? array()
            );
            if ($webhook->getLocalType() !== null) {
                $wb["localType"] = $webhook->getLocalType();
            }
            $webhooks[] = $wb;
        }
        $entity = array(
            "integrationId" => $integratonId,
            "token" => $integration->getToken(),
            "platformId" => $platformId,
            "webhooks" => $webhooks
        );
        error_log("Saving integration data: " . print_r($entity, true));
        update_option(self::COLLECTION_NAME, $entity, false);
        return true;
    }

    /**
     * Delete the integration data, includes the WooCommerce's webhooks, involves in a databse transaction
     * @throws Exception
     * @return bool
     */
    public function delete(): bool {
        global $wpdb;

        add_filter( 'query', function( $query ) {
            error_log( "[STEL-QUERY-LOG] {$query}" );
            return $query;
        });

        $integration = $this->get();
        if ( !$integration ) return false;

        $webhookIds = array_merge(...array_map(fn(Subscription $s) => $s->getLocalIds(), $integration->getSubscriptions()));

        $optionsTable = $wpdb->options;
        $wpdb->hide_errors();
        $service = WCWebhookService::getInstance();

        try {
            // 1. Iniciamos una transacción
            $wpdb->query('START TRANSACTION');
            // 2. Eliminamos la integración de la tabla de opciones
            $deleteIntegrationResult = $wpdb->query( $wpdb->prepare(
                "DELETE FROM `$optionsTable` WHERE `option_name` = %s",
                self::COLLECTION_NAME
            ) );

            if ( $deleteIntegrationResult === false ) {
                throw new Exception( 'There was an error deleting the integration option.' );
            }
            // 3. Eliminamos los webhooks asociados de la tabla de webhooks de WooCommerce
            foreach ( $webhookIds as $key => $webhookId ) {
                $service->deleteWCWebhook( (int) $webhookId );
            }
            // 4. Si todo ha ido bien, hacemos commit de la transacción
            $wpdb->query('COMMIT');
            return true;

        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log("realizando rollback por error: " . $e->getMessage());
            Logger::addLog( "Error starting transaction to delete integration: " . $e->getMessage() );
            return false;
        }
    }

    
    
}
