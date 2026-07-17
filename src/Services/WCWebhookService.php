<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use InvalidArgumentException;
use Stel\Verifactu\App;
use Stel\Verifactu\Logs\Logger;
use WC_Webhook;
use WP_Error;

class WCWebhookService {
    private static ?WCWebhookService $instance = null; // Instancia única de la clase
    private const WEBHOOK_TOPICS = array('coupon.created', 'coupon.updated', 'coupon.deleted', 'customer.created', 'customer.updated', 'customer.deleted', 'order.created', 'order.updated', 'order.deleted', 'product.created', 'product.updated', 'product.deleted');
    private const USER_INVALID = 'The user does not have permission to access this resource.';
    // Constructor privado para evitar la instanciación directa
    private function __construct() {
    }

    // Método para obtener la instancia única
    public static function getInstance(): WCWebhookService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Crea una clave de API para la integración de WooCommerce.
     * Basado en el método create_keys de WC_Auth.
     *
     * @param string $app_name Nombre de la aplicación.
     * @param int $app_user_id ID del usuario de la aplicación.
     * @param string $scope Alcance de la clave (read, write, read_write).
     * @return array Detalles de la clave creada.
     */

    public function check_user( ): bool | WP_Error {

        // Check if the user has permission to manage WooCommerce
        if ( !current_user_can( 'manage_woocommerce' ) || !current_user_can( 'manage_options' ) ) {
            $error = new WP_Error( 'invalid_user', self::USER_INVALID );
            $error->add_data( array( 'status' => 401 ) );
            return $error;
        }

        return true;
    }

    public function create_keys( $app_name, $scope ): array | WP_Error {
		global $wpdb;

		$description = wc_trim_string( wc_clean( $app_name ), 170 );

		$user  = wp_get_current_user();
        // Check if the user has permission to create API keys
        if ( ! $user || ! $user->exists() || ! user_can( $user, 'manage_woocommerce' ) || !user_can( $user, 'manage_options' )) {
            return new WP_Error( 'invalid_user', self::USER_INVALID );
        }

        // The name of the option is stel_verifactu_api_key. Although it uses a common term (_api_key), it includes our plugin’s global prefix.
        $existing_key_id = get_option(App::NAME.'_api_key', null);

		// Check if the user already has an API key and getting it by using the user ID and the description
        $existing_key = $existing_key_id ?
        
        $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}woocommerce_api_keys WHERE key_id = %d",
                $existing_key_id
            )
        ) : null;

        // Created API keys.
		$permissions     = in_array( $scope, array( 'read', 'write', 'read_write' ), true ) ? sanitize_text_field( $scope ) : 'read';
		$consumer_key    = 'ck_' . wc_rand_hash();
		$consumer_secret = 'cs_' . wc_rand_hash();

        if ( $existing_key ) {
            // Updating the existing key
    
            $wpdb->update(
                $wpdb->prefix . 'woocommerce_api_keys',
                array(
                    'permissions'     => $permissions,
                    'consumer_key'    => wc_api_hash( $consumer_key ),
                    'consumer_secret' => $consumer_secret,
                    'truncated_key'   => substr( $consumer_key, -7 ),
                ),
                array( 'key_id' => $existing_key->key_id ),
                array(
                    '%s',
                    '%s',
                    '%s',
                    '%s',
                ),
                array( '%d' )
            );
    
            return array(
                'key_id'          => $existing_key->key_id,
                'user_id'         => $user->ID,
                'consumer_key'    => $consumer_key,
                'consumer_secret' => $consumer_secret,
                'key_permissions' => $permissions,
            );
        }


		$insert_result = $wpdb->insert(
			$wpdb->prefix . 'woocommerce_api_keys',
			array(
				'user_id'         => $user->ID,
				'description'     => $description,
				'permissions'     => $permissions,
				'consumer_key'    => wc_api_hash( $consumer_key ),
				'consumer_secret' => $consumer_secret,
				'truncated_key'   => substr( $consumer_key, -7 ),
			),
			array(
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
			)
		);

        if ( false === $insert_result ) {
            return new WP_Error( 'db_insert_error', 'Error inserting API key into the database: ' . $wpdb->last_error );
        }

        // Especificamos que la clave pertenece al plugin
        add_option(App::NAME.'_api_key', $wpdb->insert_id);

		return array(
			'key_id'          => $wpdb->insert_id,
			'user_id'         => $user->ID,
			'consumer_key'    => $consumer_key,
			'consumer_secret' => $consumer_secret,
			'key_permissions' => $permissions,
		);
	}

    public function createWCWebhook(string $url, string $name, string $topic, int $userId, ?string $token = null): WC_Webhook {
        if (empty($url) || empty($name) || empty($topic) || empty($userId)) {
            throw new InvalidArgumentException('All parameters must not be empty.');
        }
        if (! is_int($userId) || $userId <= 0) {
            throw new InvalidArgumentException('User ID must be a positive integer.');
        }
        if (! is_string($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
            throw new InvalidArgumentException('URL must be a valid URL.: '.$url);
        }
        if (! is_string($name) || preg_match('/[^a-zA-Z ]/', $name)) {
            throw new InvalidArgumentException('Name must not be null and name only allows letters: '.$name);
        }
        if (! in_array($topic, self::WEBHOOK_TOPICS, true)) {
            throw new InvalidArgumentException('Topic must not be null and topic only allows letters: '.$topic);
        }
        
        $webhook = new WC_Webhook();
        $webhook->set_name("STEL {$name}");
        $webhook->set_status('active');
        $webhook->set_topic($topic);
        $webhook->set_delivery_url($url);
        $webhook->set_secret($token ?? wp_generate_password(32, false));
        $webhook->set_user_id($userId);
        $webhook->set_api_version(3);
        
        $webhook->save();
        $webhook->deliver_ping();
        
        
        
        return $webhook;
    }

    public function deleteWCWebhook(int $webhookId): bool {
        if ($webhookId <= 0) {
            throw new InvalidArgumentException('Webhook ID must be a positive integer.');
        }

        try {
            $webhook = new WC_Webhook($webhookId);
            return $webhook->delete();
        } catch (\Exception $e) {
            Logger::addLog( "Error deleting webhook with ID {$webhookId}: " . $e->getMessage() );
        }
        return false;
    }

    private function updateWebhookStatus(int $webhookId, string $status) {
        if ($webhookId <= 0) {
            throw new InvalidArgumentException('Webhook ID must be a positive integer.');
        }

        $webhook = new WC_Webhook($webhookId);
        $webhook->set_status($status);
        $webhook->save();
    }

    /**
     * Pauses multiple webhooks by their IDs.
     *
     * @param array<int> $webhookIds An array of webhook IDs to be paused.
     * @throws InvalidArgumentException if any of the webhook IDs are invalid.
     * @return void
     */
    public function pauseWebhooks(array $webhookIds) {
        foreach ($webhookIds as $webhookId) {
            $this->updateWebhookStatus($webhookId, 'disabled');
        }
    }

    /**
     * Resumes multiple webhooks by their IDs.
     *
     * @param array<int> $webhookIds An array of webhook IDs to be resumed.
     * @throws InvalidArgumentException if any of the webhook IDs are invalid.
     * @return void
     */
    public function resumeWebhooks(array $webhookIds) {
        foreach ($webhookIds as $webhookId) {
            $this->updateWebhookStatus($webhookId, 'active');
        }
    }

    
}
