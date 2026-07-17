<?php

namespace Stel\Verifactu\Controllers\Security;
use Stel\Verifactu\Controllers\Utils\RestUtils;

class SecurityRestFilter {

    private static ?SecurityRestFilter $instance = null;

    private function __construct() {
        add_filter('woocommerce_rest_is_request_to_rest_api', function ($value) {
            $currentRestUrl = RestUtils::getCurrentRestUrl();
            if (str_starts_with($currentRestUrl, '/stel/verifactu/')) {
                return true;
            }

            return $value;
        }, 10, 1);
    }

    public static function getInstance(): SecurityRestFilter {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function applyAuthFilter(\WP_REST_Request $request): void {
        $currentUserId = get_current_user_id();
        // Si ya hay un usuario autenticado, no hacemos nada
        if ($currentUserId !== 0) {
            return;
        }

        $currentRestUrl = RestUtils::getCurrentRestUrl();
        $jsonBody = $request->get_json_params();

        if (!str_starts_with($currentRestUrl, '/stel/verifactu/') || !isset($jsonBody['auth_token'])) {
            return;
        }
        $authToken = $jsonBody['auth_token'];
        $credentials = self::decodeBasicAuthToken($authToken);
        if ($credentials === false) {
            return;
        }
        // Establecemos las credenciales en las variables de servidor para que WooCommerce las reconozca
        $_SERVER['PHP_AUTH_USER'] = $credentials[0];
        $_SERVER['PHP_AUTH_PW'] = $credentials[1];

        $authUserId = \WC_REST_Authentication::instance()->authenticate(false);
        if ($authUserId && $authUserId > 0) {
            wp_set_current_user($authUserId);
        }
    }

    private static function decodeBasicAuthToken(string $authToken): array | false {
        if (empty($authToken)) {
            return false;
        }
        $decoded = base64_decode($authToken);
        if ($decoded === false) {
            return false;
        }
        $parts = explode(':', $decoded, 2);
        if (count($parts) !== 2) {
            return false;
        }
        if (str_starts_with($parts[0], 'ck_') && str_starts_with($parts[1], 'cs_')) {
            return $parts;
        }
        return false;
    }


}
