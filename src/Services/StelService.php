<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Exception;
use InvalidArgumentException;
use RuntimeException;

use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Logs\LogUtils;
use Stel\Verifactu\Logs\TransientLog;
use Stel\Verifactu\Repositories\IntegrationRepository;
use Stel\Verifactu\Services\DTOs\CreateIntegrationDTO;
use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;
use Stel\Verifactu\Services\Utils\ErrorMessages;
use WP_Error;
use WP_Http;

class StelService
{
    private static ?StelService $instance = null; // Instancia única de la clase
    public const STEL_INTEGRATIONS_URL = 'https://app.stelorder.com';
    public const STEL_API_MICROSERVICE_URL = 'https://woocommerce.stelorder.com/stelWoocommerceVerifactu/api/v1/';

    public const MUST_FIELDS = [
        'order' => []
    ];

    private const RESULT_FIELD_MAPPING = [
        'order' => []
    ];

    private IntegrationRepository $integrationRepository;
    private WCWebhookService $wcWebhookService;

    // Constructor privado para evitar la instanciación directa
    private function __construct()
    {
        $this->integrationRepository = IntegrationRepository::getInstance();
        $this->wcWebhookService = WCWebhookService::getInstance();
        $this->setRequestConfig();
    }

    private function setRequestConfig(): void {

        add_filter('http_request_args', function ($args, $url) {

            $stelHost = wp_parse_url(self::STEL_API_MICROSERVICE_URL, PHP_URL_HOST);
            $urlHost = wp_parse_url($url, PHP_URL_HOST);
            if (!empty($urlHost) && $urlHost === $stelHost) {
                if (!isset($args['timeout']) || $args['timeout'] < 30) {
                    $args['timeout'] = 30;
                }
            }
            return $args;
        }, 10, 2);

    }

    // Método para obtener la instancia única
    public static function getInstance(): StelService
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function requestTempToken(string $consumerKey, string $consumerSecret): string
    {
        if (empty($consumerKey) || !is_string($consumerKey)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_CONSUMER_KEY);
        }
        if (empty($consumerSecret) || !is_string($consumerSecret)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_CONSUMER_SECRET);
        }

        $siteUrl = get_site_url();
        $parsedUrl = wp_parse_url($siteUrl);

        $host = $parsedUrl['host'] 
            . (isset($parsedUrl['path']) ? $parsedUrl['path'] : '');

        $body = array(
            'credentials' => 'client-secret',
            'name' => $host,
            'type' => 'woocommerce',
            'clientSecret' => $consumerKey,
            'privateSecret' => $consumerSecret,
        );
        $response = wp_remote_post(self::STEL_API_MICROSERVICE_URL . 'integrations/accessToken', array(
            'body' => json_encode($body),
            'headers' => array(
                'Content-Type' => 'application/json',
            )
        ));

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) >= WP_Http::BAD_REQUEST) {
            error_log("Error al solicitar el token temporal: " . var_export($response, true));
            throw new RuntimeException('There was an error while trying to request the temporary token.');
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $token = $body['token'] ?? null;
        if (empty($token) || !is_string($token)) {
            throw new RuntimeException('There was an error while trying to request the temporary token.');
        }
        return $token;
    }
    
    public function deleteIntegration(string $integrationId, string $token): bool
    {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}?fromPlatformType=woocommerce";
        error_log('Token: ' . $token);
        $response = wp_remote_request($url, [
            'method' => 'DELETE',
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
            ]
        ]);

        if (is_wp_error($response)) {
            throw new RuntimeException('There was an error while trying to delete the integration.');
        }

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        error_log("Complete delete integration: ".$http_code);
        return true;
    }

    public function pauseIntegration(string $integrationId, string $token): bool
    {
        return $this->updateIntegrationStatus($integrationId, $token, 'PAUSED');
    }

    public function resumeIntegration(string $integrationId, string $token): bool
    {
        return $this->updateIntegrationStatus($integrationId, $token, 'ACTIVE');
    }

    private function updateIntegrationStatus (string $integrationId, string $token, string $status): bool {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($status) || !is_string($status) || !preg_match('/^(ACTIVE|PAUSED)$/', $status)) {
            throw new InvalidArgumentException();
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/status?fromPlatformType=woocommerce";
        error_log('Token: ' . $token);
        $response = wp_remote_request($url, [
            'method' => 'PUT',
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ],
            'body' => json_encode([
                'status' => $status,
            ])
        ]);

        if (is_wp_error($response)) {
            throw new RuntimeException('There was an error while trying to pause the integration.');
        }

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        error_log("Complete pause integration: ".$http_code);
        return true;
    }

    public function resetConfiguration(string $integrationId, string $token): array {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/configurations/defaults";
        $response = wp_remote_request($url, [
            'method' => 'PUT',
            'headers' => [
                "Authorization" => "Bearer {$token}",
            ]
        ]);
        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        return json_decode(wp_remote_retrieve_body($response), true) ?? [];
    }

    public function getSummary(string $integrationId, string $platformId, string $token): array {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($platformId) || !is_string($platformId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $platformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/platforms/{$platformId}/summary";
        $response = wp_remote_get($url, [
            'headers' => [
                'Authorization' => "Bearer {$token}",
            ]
        ]);

        $http_code = wp_remote_retrieve_response_code($response);

        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        return json_decode(wp_remote_retrieve_body($response), true) ?? [];
    }

    public function getDocuments(string $integrationId, string $platformId, string $token): array {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($platformId) || !is_string($platformId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $platformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/platforms/{$platformId}/documents";
        $response = wp_remote_get($url, [
            'headers' => [
                'Authorization' => "Bearer {$token}",
            ]
        ]);

        $http_code = wp_remote_retrieve_response_code($response);

        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        return json_decode(wp_remote_retrieve_body($response), true) ?? [];
    }

	/**
	 * Notify transient logs to the Stel API microservice.
	 *
	 * @param TransientLog[] $logs Array of logs to be sent.
	 * @param string $integrationId The integration ID.
	 * @param string $token The authorization token.
	 *
	 * @throws InvalidArgumentException If any of the parameters are invalid.
	 */
	public function notifyTransientLogs( array $logs, string $integrationId, string $token): void {
		if (empty($integrationId)) {
			throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
		}
		if (empty($token)) {
			throw new InvalidArgumentException("Token must not be empty.");
		}
		if (empty($logs)) {
			throw new InvalidArgumentException("Logs array must not be empty.");
		}

		$url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/logs";
		$transientLogs = array_filter($logs, function($log) {
			return $log instanceof TransientLog;
		});
		$body = array_map(function(TransientLog $log) {
			$result = [
				'id' => $log->getId(),
				'request_id' => $log->getRequestId(),
				'created_at' => $log->getCreatedAt(),
                'shop' => wp_parse_url(home_url(), PHP_URL_HOST) ?: null
			];
			$logContent = json_decode($log->getLogContent(), true);
			if (is_array($logContent)) {
				foreach ($logContent as $key => $value) {
					$result[$key] = $value;
				}
			}
			return $result;
		}, $transientLogs);

		try {
			$encodedBody = json_encode($body, JSON_THROW_ON_ERROR);

			wp_remote_post($url, [
				'headers' => [
					'Authorization' => "Bearer {$token}",
					'Content-Type' => 'application/json',
				],
				'body' => $encodedBody,
			]);
		} catch (\Throwable $t) {
			$failedLog = new TransientLog(
				[
					'type'          => 'failed_notify_transient_logs',
					'error'       => get_class($t),
					'class_name'     => $t->getFile(),
					'message_error' => LogUtils::printThrowableTrace($t),
					'instance'    => TransientLog::INSTANCE_ERROR
				]
			);
			$failedLog->save();
		}


	}

    public function getInvoices(string $integrationId, string $platformId, string $token, int $firstElement = 0, int $pageSize = 30) {
        return $this->getPaginatedResource('invoices', $integrationId, $platformId, $token, $firstElement, $pageSize);
    }

    public function getOrders(string $integrationId, string $platformId, string $token, int $firstElement = 0, int $pageSize = 30) {
        return $this->getPaginatedResource('salesOrders', $integrationId, $platformId, $token, $firstElement, $pageSize);
    }

    private function getPaginatedResource(string $resource, string $integrationId, string $platformId, string $token, int $firstElement = 0, int $pageSize = 30) {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($platformId) || !is_string($platformId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $platformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/platforms/{$platformId}/{$resource}?firstElement={$firstElement}&pageSize={$pageSize}";
        $response = wp_remote_get($url, [
            'headers' => [
                'Authorization' => "Bearer {$token}",
            ]
        ]);

        $http_code = wp_remote_retrieve_response_code($response);

        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }

        return json_decode(wp_remote_retrieve_body($response), true) ?? [];
    }

    public function getAvailableConfiguration(string $integrationId, string $token): array {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/". $integrationId ."/configurations?available=true";
        $response = wp_remote_get($url, [
            'headers' => [
                "Authorization" => "Bearer {$token}",
            ]
        ]);
        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            if (is_wp_error($response)) {
                $errorMessage = $response->get_error_message();
            } else {
                $errorMessage = wp_remote_retrieve_body($response);
            }
            throw new RuntimeException("HTTP Error {$http_code}" . !empty($errorMessage) ? ": " . $errorMessage : 'Se ha producido un error al intentar obtener la configuración disponible.');
        }
        return json_decode(wp_remote_retrieve_body($response), true);
    }

    public function checkExistsSubscriber(string $integrationId, string $subscriberId, string $token): bool {
         if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
         if (empty($subscriberId) || !is_string($subscriberId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $subscriberId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }

        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber/{$subscriberId}";
        $response = wp_remote_request($url, [
            'method' => 'HEAD',
            'headers' => [
                "Authorization" => "Bearer {$token}",
            ]
        ]);

        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND) {
                return false;
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }

        return true;
    }

    public function updateIntegrationConfig(string $integrationId, array $config, string $token): void {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }

        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/configurations";

        $response = wp_remote_request($url, [
            'method' => 'PUT',
            'headers' => [
                "Authorization" => "Bearer {$token}",
                "Content-Type" => "application/json",
            ],
            'body' => json_encode($config),
        ]);

        $http_code = wp_remote_retrieve_response_code($response);

        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }

    }

    public function getPlatformVerifactuConfig( string $integrationId, string $platformId, string $token): array {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($platformId) || !is_string($platformId) || !preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $platformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/platforms/{$platformId}/config/verifactu";
        $response = wp_remote_get($url, [
            'headers' => [
                "Authorization" => "Bearer {$token}",
            ]
        ]);
        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        return json_decode(wp_remote_retrieve_body($response), true) ?? [];
    }


    public function updateWebhook(string $integrationId, array $entities, string $token): array
    {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($entities) || !is_array($entities)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_ENTITY_ARRAY);
        }
        $updateWbUrl = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber";
        
        $body = array(
            "subscribers" => array()
        );

        foreach ($entities as $entity) {
            if (!$entity instanceof SaveWebhookDTO)
                throw new InvalidArgumentException("entity must be an instance of SaveWebhookDTO");

            $processRecords = array(
                "records" => array()
            );
            $this->processRecordBody($processRecords, array_keys(
                // Filtramos los campos que no son false
                array_filter(
                    $entity->getFields(),
                    function ($field) {
                        return $field === true;
                    }
                )
            ), $entity->getName());
            
            $body["subscribers"][] = array(
                "subscriberId" => $entity->getExternalId(),
                "fields" => $processRecords
            );
            
        }
        error_log("Body: " . json_encode($body));
        $response = wp_remote_request($updateWbUrl, array(
            'method' => 'PUT',
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ),
            'body' => json_encode($body)
        ));
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) >= WP_Http::BAD_REQUEST) {
            error_log('Se ha producido un error al intentar actualizar el webhook: ' . print_r(wp_remote_retrieve_body($response), true));
            throw new RuntimeException(ErrorMessages::WEBHOOK_UPDATE_ERROR);
        }
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (is_array($data) && !empty($data)) {
            return $data["subscribers"];
        }
        throw new RuntimeException(ErrorMessages::WEBHOOK_UPDATE_ERROR);
    }


    public function createWebhooks(array $webhooks, string $integrationId, string $platformId, string $token){
        if ( empty($webhooks)) {
            throw new InvalidArgumentException('Webhooks must not be empty.');
        }
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException('Integration ID must not be empty and must be a string.');
        }
        $createWebhookUrl = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber";
        $body = array();
        foreach ($webhooks as $webhook) {
            if (!is_array($webhook["fields"])) {
                throw new InvalidArgumentException(ErrorMessages::INVALID_RECORDS);
            }
            if (empty($webhook["name"]) || !is_string($webhook["name"])) {
                throw new InvalidArgumentException(ErrorMessages::INVALID_ENTITY);
            }
            $subscriber = array(
                'topic' => "wc.{$webhook["name"]}",
                'platformId' => $platformId,
                'records' => array(),
            );
            error_log("fields: " . print_r($webhook["fields"], true));
            $this->processRecordBody($subscriber, array_values(
                // Filtramos los campos que no son false
                
                $webhook["fields"]
            ), $webhook["name"]);
            

            $body[] = $subscriber;
        }
       
        $response = wp_remote_request($createWebhookUrl, array(
            'method' => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ),
            'body' => json_encode(array_values($body)),
        ));

        $error_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $error_code >= WP_Http::BAD_REQUEST) {
            throw new InvalidArgumentException(ErrorMessages::WEBHOOK_CREATION_ERROR . wp_remote_retrieve_body($response));
        }
        
        $data = json_decode( wp_remote_retrieve_body($response), true);
        
        if (is_array($data) && !empty($data) && !empty($data['subscribers'])) {
            return $data['subscribers'];
        }
        throw new RuntimeException(ErrorMessages::WEBHOOK_CREATION_ERROR);
    }

    public function createWebhook(string $entity, string $name, string $plaformId, string $integrationId, array $records, $token)
    {
        if (!is_array($records)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_RECORDS);
        }
        if (empty($entity) || !is_string($entity)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_ENTITY);
        }
        if (empty($plaformId) || !is_string($plaformId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $plaformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }


        $createWebhookUrl = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber";
        $body = array(
            'topic' => "wc.{$entity}",
            'platformId' => $plaformId,
            'url' => 'https://webhook.site/69129e9b-78c3-416f-a58d-623ae8cd7504',
            'httpMethod' => 'POST'
        );
        $body['records'] = array();
        $this->processRecordBody($body, $records, $name);
        error_log("Body: " . json_encode($body));
        $response = wp_remote_post($createWebhookUrl, args: array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ),
            'body' => json_encode($body)
        ));
        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        // Obtenemos la respuesta que contiene el webhook y lo devolvemos
        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (is_array($data) && !empty($data)) {
            return $data["subscribers"];
        }
        throw new RuntimeException(ErrorMessages::WEBHOOK_CREATION_ERROR);
    }

    private function processRecordBody(&$body, $records, $name)
    {
        $mustEntityFields = self::MUST_FIELDS[$name] ?? [];
        foreach ($mustEntityFields as $field) {
            // Comprobamos si existe el campo
            if ( array_search($field, $records) === false ) {
                $records[] = $field; // Añadimos el campo si no existe
            }
        }

        foreach ($records as $record) {
            if (!is_string($record) || !preg_match('/[a-z_]+/', $record)) {
                throw new InvalidArgumentException(ErrorMessages::INVALID_RECORD . $record);
            }
            $result = array(
                'sourceField' => $record
            );
            if (isset($this::RESULT_FIELD_MAPPING[$name][$record])) {
                $result['resultField'] = $this::RESULT_FIELD_MAPPING[$name][$record];
            }
            $body['records'][] = $result;
        }
    }

    public function getWebhooks(string $integrationId, string $platformId, string $token)
    {
        if (empty($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($platformId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $platformId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_PLATFORM_ID);
        }
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/platforms/{$platformId}/subscribers";
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
            )
        ));
        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            // TODO: Cambiar en el resto de métodos la forma de obtener el error
            $body = wp_remote_retrieve_body($response);
            throw new RuntimeException(
                "HTTP Error {$http_code}: " .
                json_encode($body)
            );
        }
        $body = wp_remote_retrieve_body($response);
        error_log($body);
        $data = json_decode($body, true);
        if (!is_array($data)) {
            throw new Exception(ErrorMessages::WEBHOOK_GET_ERROR);
        }
        // Devolvemos únicamente los webhooks asociados a la plataforma de wooCommerce
        $result = array_filter($data, function ($wb) use ($platformId) {
            return !empty($wb['platform_id']) && ($wb['platform_id'] == $platformId);
        });
        error_log(json_encode($result));
        return $result;
    }

    public function getIntegration(string $integrationId, string $token): array
    {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }

        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}";
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
            )
        ));

        if (is_wp_error($response)) {
            throw new RuntimeException('There was an error while trying to get the integration.');
        }

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }


        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        if (empty($data)) {
            throw new Exception(ErrorMessages::INTEGRATION_GET_ERROR);
        }

        return $data;
    }

    public function deleteWebhooks(string $integrationId, array $subscriberIds, string $token): void {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($subscriberIds) || !is_array($subscriberIds)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_SUBSCRIBER_ID);
        }
        foreach ($subscriberIds as $subscriberId) {
            if (empty($subscriberId) || !is_string($subscriberId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $subscriberId)) {
                throw new InvalidArgumentException(ErrorMessages::INVALID_SUBSCRIBER_ID);
            }
        }
        $deleteWebhooksUrl = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber";
        error_log("Printing body: " . json_encode(array("subscribers" => array_values($subscriberIds))));
        $response = wp_remote_request( $deleteWebhooksUrl, array(
            'method' => 'DELETE',
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $token,
            ),
            'body' => json_encode(array("subscribers" => array_values($subscriberIds)))
        ));
        $http_code = wp_remote_retrieve_response_code($response);
        if (is_wp_error($response) || $http_code >= WP_Http::BAD_REQUEST) {
            throw new RuntimeException( ErrorMessages::WEBHOOK_DELETION_ERROR . wp_remote_retrieve_body($response));
        }

    }

    public function deleteWebhook(string $integrationId, string $subscriberId, string $token): void
    {
        if (empty($integrationId) || !is_string($integrationId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_INTEGRATION_ID);
        }
        if (empty($subscriberId) || !is_string($subscriberId) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $subscriberId)) {
            throw new InvalidArgumentException(ErrorMessages::INVALID_SUBSCRIBER_ID);
        }
        // TODO: Incluir el JWT token cuando se implemente la autenticación
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/{$integrationId}/subscriber/{$subscriberId}";
        $response = wp_remote_request($url, [
            'method' => 'DELETE',
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
            ]
        ]);

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            if ($http_code == WP_Http::NOT_FOUND || $http_code == WP_Http::CONFLICT || $http_code == WP_Http::UNAUTHORIZED) {
                throw new EntityNotFound(ErrorMessages::INTEGRATION_NOT_FOUND);
            }
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }


    }


    public function getEvents(string $integrationId, string $token, int $firstElement = 0, int $pageSize = 30): array {
        $url = self::STEL_API_MICROSERVICE_URL . "integrations/". $integrationId ."/jobs?firstElement={$firstElement}&pageSize={$pageSize}";
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
            )
        ));
        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code >= WP_Http::BAD_REQUEST) {
            throw new RuntimeException("HTTP Error {$http_code}: " . wp_remote_retrieve_body($response));
        }
        $body = wp_remote_retrieve_body($response);
        $events = json_decode($body, true);
        
        return $events ?? [];
    }




}
