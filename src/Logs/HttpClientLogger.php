<?php

namespace Stel\Verifactu\Logs;


use Stel\Verifactu\Services\StelService;

class HttpClientLogger {
    private static ?HttpClientLogger $instance = null;

    private function __construct() {
		// Private constructor to prevent direct instantiation
    }

    public static function getInstance(): HttpClientLogger {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register(): void {
		add_filter('http_request_args', function (array $args, string $url) {
			if ( ! str_starts_with( $url, StelService::STEL_API_MICROSERVICE_URL ) ) {
				return $args;
			}
			$headers = $args['headers'] ?? [];
			if (! empty($headers) && is_array($headers)) {
				$headers['X-Request-ID'] = TransientLog::getLocalRequestId();
				$args['headers'] = $headers;
				error_log("Request ID added: " . $headers['X-Request-ID']);
			}
			return $args;
		}, 10, 2);

        add_filter('http_response', function ($response, array $args, string $url) {
            if ( ! str_starts_with( $url, StelService::STEL_API_MICROSERVICE_URL ) ) {
                return $response;
            }

            $code = is_array($response) ? (int) wp_remote_retrieve_response_code($response) : null;

			$body = is_array($response) ? wp_remote_retrieve_body($response) : null;

            Logger::addLog( [
	            'type'            => 'http_client_logger',
	            'url'             => $url,
	            'method'          => $args['method'] ?? null,
	            'response_status' => $code,
	            'instance' => $code >= 200 && $code < 400 ? TransientLog::INSTANCE_LOG : TransientLog::INSTANCE_ERROR,
	            'message_log' => $body ?? 'HTTP request completed from Stel API Client',
            ] );

            return $response;
        }, 10, 3);

        add_action('http_api_debug', function ($response, string $context, string $class, array $args, string $url) {
            if ($context !== 'http_request_failed') {
                return;
            }
            if ( ! str_starts_with( $url, StelService::STEL_API_MICROSERVICE_URL ) ) {
                return;
            }

            Logger::addLog( [
	            'type'            => 'http_request_failed',
	            'url'             => $url,
	            'method'          => $args['method'] ?? null,
	            'message_log'           => is_wp_error( $response ) ? $response->get_error_message() : null,
	            'response_status' => is_wp_error( $response ) ? $response->get_error_code() : null,
	            'instance' => TransientLog::INSTANCE_LOG,
            ] );
        }, 10, 5);
    }


}
