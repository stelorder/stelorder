<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Repositories;

use Exception;
use WC_Webhook;

abstract class WCDataRepository {
    const WC_DATA_CLASS = 'WC_Data'; // Clase base de WooCommerce para datos
    private static array $instances = []; // Instancia única de la clase

    // Bandera para suspender webhooks en este request
    protected bool $suppress_webhooks = false;

    // Constructor privado para evitar la instanciación directa
    protected function __construct() {
        // registrar filtro si no está registrado todavía
        if (!has_filter('woocommerce_webhook_should_deliver', [$this, 'maybe_block_webhook'])) {
            add_filter('woocommerce_webhook_should_deliver', [$this, 'maybe_block_webhook'], 10, 3);
        }
    }


    // Método para obtener la instancia única
    public static function getInstance(): WCDataRepository {
        $subClass = static::class;
        if (!isset(self::$instances[$subClass])) {
            
            self::$instances[$subClass] = new $subClass();
        }
        return self::$instances[$subClass];
    }

    protected abstract function getResourceClass(): string;

    public function findById(string $entityId) {
        $entity = null;
        if ( !class_exists( static::WC_DATA_CLASS ) || !class_exists( static::getResourceClass() ) ) {
            throw new Exception(static::WC_DATA_CLASS . " or " . $this->getResourceClass() . " class not found. Ensure WooCommerce is active.");
        }

        if (!is_subclass_of($this->getResourceClass(), 'WC_Data')) {
            throw new Exception($this->getResourceClass() . " is not a subclass of WC_Data.");
        }

        try {
            $entity = new ($this->getResourceClass())($entityId);

            if (!$entity->get_id()) {
                return null;
            }
        } catch (\Throwable $th) {
            return null; // Si se produce un error al acceder al DAO, por ejemplo si el ID no existe, devolvemos null
        }
        return $entity;
    }

    /**
     * This method allows to block webhooks delivery if the suppress flag is set.
     * @param bool $suppress
     * @return void
     */
    protected function setSuppressWebhooks(bool $suppress): void {
        $this->suppress_webhooks = $suppress;
    }

    public function maybe_block_webhook($should_deliver, WC_Webhook $webhook, $arg) {
        if (!$this->suppress_webhooks) {
            return $should_deliver;
        }

        // Obtenemos el topic del webhook
        try {
                $topic = (string) $webhook->get_topic();
                if (stripos($topic, 'order.updated') !== false || stripos($topic, 'product.updated') !== false) {
                    return false;
                }
            } catch (\Throwable $e) {
                // por seguridad, si algo falla no interrumpimos otras entregas
                return $should_deliver;
            }

        // si no podemos determinar el topic, por seguridad devolvemos false
        return false;
    }
}