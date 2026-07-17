<?php

namespace Stel\Verifactu\Controllers;

use Exception;
use InvalidArgumentException;

use Stel\Verifactu\Controllers\DTOs\CreateLocalSubscriptionDto;
use Stel\Verifactu\Controllers\DTOs\ExistingProductById;
use Stel\Verifactu\Controllers\DTOs\QueryProductsDto;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProduct;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProductImages;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProductStock;
use Stel\Verifactu\Controllers\DTOs\SubscriptionDTO;
use Stel\Verifactu\Controllers\Security\SecurityRestFilter;
use Stel\Verifactu\Controllers\Utils\DTODeserializerValidator;
use Stel\Verifactu\Controllers\Utils\RestUtils;
use Stel\Verifactu\Domain\InvoiceStatus;
use Stel\Verifactu\Domain\RefundDetails;
use Stel\Verifactu\Domain\Subscription;
use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Logs\TransientLog;
use Stel\Verifactu\Repositories\SiteDetailsRepository;
use Stel\Verifactu\Services\AccountService;
use Stel\Verifactu\Services\DTOs\CreateIntegrationDTO;
use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;
use Stel\Verifactu\Services\IntegrationService;
use Stel\Verifactu\Services\InvoiceOrderDetailsService;
use Stel\Verifactu\Services\ProductService;
use Stel\Verifactu\Services\WCWebhookService;
use Stel\Verifactu\Services\StelService;
use WP_Error;
use WP_Http;
use WP_REST_Request;
use WP_REST_Response;

class StelVerifactuController {
	protected $namespace;
	protected $resource_name;
	protected $integrationService;
	protected $accountService;
	protected $wcWebhookService;
	protected $invoiceOrderDetailsService;

	
	private static ?StelVerifactuController $instance = null;


	private function __construct(IntegrationService $integrationService, WCWebhookService $wcWebhookService, AccountService $accountService, InvoiceOrderDetailsService $invoiceOrderDetailsService) {
		$this->namespace     = 'stel/verifactu/v1';
		$this->resource_name = 'webhooks';
		$this->integrationService = $integrationService;
		$this->wcWebhookService = $wcWebhookService;
		$this->accountService = $accountService;
		$this->invoiceOrderDetailsService = $invoiceOrderDetailsService;
		add_action( 'rest_api_init', [$this, 'register_routes'] );

		$this->registerWebFilters();
	}

	public static function getInstance(): StelVerifactuController {
		if (self::$instance === null) {
			self::$instance = new self(IntegrationService::getInstance(), WCWebhookService::getInstance(), AccountService::getInstance(),
			InvoiceOrderDetailsService::getInstance());
		}
		return self::$instance;
	}

	private function registerWebFilters(): void {
		add_filter('rest_request_after_callbacks', function ($response, $handler, WP_REST_Request $request) {
            try {
				if ( ! str_starts_with( $request->get_route(), '/stel/verifactu/v1/' ) ) {
                	return $response;
            	}

                $raw_ip = $_SERVER['REMOTE_ADDR'] ?? '';
                $ip     = sanitize_text_field( wp_unslash( $raw_ip ) );
				$log = [
					"url" => $request->get_route(),
					"origin" => rest_is_ip_address($ip) ? $ip : null,
					"method" => $request->get_method(),
					"type" => "controller",
					"instance" => TransientLog::INSTANCE_LOG
				];
				
				if ($response instanceof WP_REST_Response) {
					$log['response_status'] = $response->get_status();
					$log['message_log'] = 'Controller request completed successfully';
				} elseif ($response instanceof WP_Error) {
					if (!empty($response->get_error_data()) && !empty($response->get_error_data()['status'])) {
						$log['status_response'] = $response->get_error_data()['status'];
					}
                    $log['function_name'] = $request->get_route();
					$log['message_error'] = $response->get_error_message();
					$log['instance'] = TransientLog::INSTANCE_ERROR;

				}
				Logger::addLog( $log );
			} catch(Exception $e) {
				error_log("Error logging REST request: " . $e->getMessage());
			}finally {
				return $response;
			}
        }, 10, 3);

		// Desactivamos el tracking de cambios de producto para las actualizaciones de producto
		// ya que no deben generar un evento para sincronizarlos
		add_filter('rest_request_before_callbacks', function ($response, $handler, WP_REST_Request $request) {
			// Si es una solicitud a /products
			if ( str_ends_with( $request->get_route(), '/stel/verifactu/v1/products' ) ) {
				add_filter('stel_verifactu_should_track_product_changes', [$this, 'disabledProductTrackChanges'], 10, 2);
            }
			return $response;
		}, 10, 3);
	}

	public function disabledProductTrackChanges(bool $enabled, \WC_Product $product): bool {
		return false;
	}

	// Register our routes.
	public function register_routes() {
		
		register_rest_route( $this->namespace, '/auth', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => array( $this, 'auth_platform' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace, '/orders/statuses', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => function(WP_REST_Request $request ) {
					try {
						$statues = wc_get_order_statuses();
						$statusWithoutPrefix = [];
						foreach ($statues as $key => $value) {
							if (strpos($key, 'wc-') === 0) {
								$newKey = substr($key, 3);
							} else {
								$newKey = $key;
							}
							$statusWithoutPrefix[$newKey] = $value;
						}
						return new WP_REST_Response(
							$statusWithoutPrefix
						, WP_Http::OK);
					} catch ( Exception $e ) {
						return new WP_Error( 'rest_internal_error', 'An error occurred: ' . $e->getMessage(), array( 'status' => 500 ) );
					}
				},
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace, '/' . $this->resource_name, array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => array( $this, 'save_legacy_subscriptions'),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
        register_rest_route( $this->namespace, '/' . "subscriptions/local", array(
            array(
                'methods'   => 'POST',
                'callback'  => array( $this, 'create_local_subscription'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
        register_rest_route( $this->namespace, '/' . "products", array(
            array(
                'methods'   => 'PUT',
                'callback'  => array( $this, 'save_external_products'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
        register_rest_route( $this->namespace, '/' . "query/exists/products", array(
            array(
                'methods'   => 'POST',
                'callback'  => array( $this, 'check_external_product_exists'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
        register_rest_route( $this->namespace, '/' . "products/stock", array(
            array(
                'methods'   => 'PUT',
                'callback'  => array( $this, 'save_external_product_stock'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
        register_rest_route( $this->namespace, '/' . "products/images", array(
            array(
                'methods'   => 'PUT',
                'callback'  => array( $this, 'save_external_product_images'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
		register_rest_route( $this->namespace, '/' . "query/products", array(
			array(
				'methods' => 'POST',
				'callback' => array( $this, 'get_external_products' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		));
        register_rest_route( $this->namespace, '/' . "subscriptions/(?P<name>\w+)/local", array(
            // Here we register the readable endpoint for collections.
            array(
                'methods'   => 'DELETE',
                'callback'  => array( $this, 'delete_local_subscription'),
                'permission_callback' => array( $this, 'check_auth_platform' ),
            )
        ) );
		register_rest_route( $this->namespace,'/integrations', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => array( $this, 'create_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/success', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => function(WP_REST_Request $request) {
                    $authValue = $request->get_header('Authorization') ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
                    $authValue = sanitize_text_field($authValue);
                    $authHeaderPresent = !empty($authValue);
                    return new WP_REST_Response(array(
                        'message' => 'Integration created successfully.',
                        'method' => $authHeaderPresent ? 1 : 2
                    ), WP_Http::OK);
                },
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/status', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => function() { return new WP_REST_Response(array('message' => 'Integration status updated successfully.'), WP_Http::OK); },
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/summary', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => [ $this,'get_integration_summary' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/configurations', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => [ $this,'get_integration_config' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/configurations', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => [ $this,'update_integration_config' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/documents', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => [ $this,'get_integration_documents' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/invoices', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => [ $this,'get_integration_invoices' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/orders', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => [ $this,'get_integration_orders' ],
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/tempAccessToken', array(
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'POST',
				'callback'  => array( $this, 'create_integration_access_token' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'DELETE',
				'callback'  => array( $this, 'delete_integration'),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/local', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'DELETE',
				'callback'  => array( $this, 'delete_local_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/local/status/paused', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'pause_local_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/status/paused', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'pause_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/local/status/active', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'resume_local_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/status/active', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'resume_integration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/integrations/configurations/defaults', array( 
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'reset_configuration' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		// Endpoint para obtener los webhooks
		register_rest_route( $this->namespace,'/webhooks', array( 
			// Here we register the readable endpoint for collections.
			array(
				'methods'   => 'GET',
				'callback'  => array( $this, 'get_webhooks' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/events', array(
			array(
				'methods'   => 'GET',
				'callback'  => array( $this, 'getLogEvents' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/orders/(?P<id>\d+)/details/pdf', array(
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'addInvoiceOrderMeta' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/orders/(?P<id>\d+)/details/salesOrder/pdf', array(
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'addSalesOrderPdf' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/orders/(?P<id>\d+)/details/refunds', array(
			array(
				'methods'   => 'POST',
				'callback'  => array( $this, 'addRefundDetails' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
		register_rest_route( $this->namespace,'/orders/(?P<id>\d+)/details/status', array(
			array(
				'methods'   => 'PUT',
				'callback'  => array( $this, 'updateInvoiceOrderStatus' ),
				'permission_callback' => array( $this, 'check_auth_platform' ),
			)
		) );
	}

	public function updateInvoiceOrderStatus( WP_REST_Request $request ) {
		$status = sanitize_text_field($request->get_json_params()['inconsistency']);
		$externalId = absint($request->get_param('id'));
		if ( !filter_var( $externalId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ) {
			return new WP_Error( 'rest_invalid_argument', 'externalId must be a valid order ID: ' . $externalId, array( 'status' => 400 ) );
		}
		if ( empty( $status ) || !is_string( $status ) || !InvoiceStatus::tryFrom($status) ) {
			return new WP_Error( 'rest_invalid_argument', 'Status must be a non-empty string with a valid value (EDITED): ' . $status,
			array( 'status' => 400 ) );
		}

		try {
			$this->invoiceOrderDetailsService->updateStatus((int)$externalId, InvoiceStatus::tryFrom($status));
			return rest_ensure_response(array('message' => 'Invoice order status updated successfully.'));
		} catch ( InvalidArgumentException $e ) {
			return new WP_Error( 'rest_invalid_argument', 'Invalid argument: ' . $e->getMessage(), array( 'status' => 400 ) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', 'An error occurred: ' . $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function addRefundDetails( WP_REST_Request $request ) {
		$jsonBody = $request->get_json_params();
		$externalId = absint($request->get_param('id'));
		if ( !filter_var( $externalId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ) {
			return new WP_Error( 'rest_invalid_argument', 'externalId must be a valid order ID: ' . $externalId, array( 'status' => 400 ) );
		}
		if ( empty($jsonBody) || !isset($jsonBody['refunds']) ) {
			return new WP_Error( 'rest_invalid_argument', 'Refunds must be provided', array( 'status' => 400 ) );
		}
	    $refunds = $jsonBody['refunds'];

        if (!is_array($refunds)) {
            return new WP_Error( 'rest_invalid_argument', 'Refunds must be an array', array( 'status' => 400) );
        }

		/**
		 * @var \Stel\Verifactu\Domain\RefundDetails[]
		 */

		$refundDetails = [];

		foreach ( $refunds as $refund ) {
			try {
				if ( !is_array( $refund ) ) {
					return new WP_Error( 'rest_invalid_argument', 'Each refund must be an object', array( 'status' => 400 ) );
				}
                // $pdfResource must be a valid UUID
                $pdfResource = sanitize_text_field($refund['pdfUrl']);
                // Then validate the UUID format
                if (!preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $pdfResource)) {
                    return new WP_Error( 'rest_invalid_argument', 'pdfUrl must be a valid UUID: ' . $pdfResource, array( 'status' => 400 ) );
                }
                $pdfUrl = (string)(!empty($refund['pdfUrl']) && is_string($refund['pdfUrl']) ? StelService::STEL_API_MICROSERVICE_URL . 'resources/' . $refund['pdfUrl'] : '');
                $pdfUrl = esc_url_raw($pdfUrl);
                $createdDate = sanitize_text_field($refund['createdDate']);
				$refundDetails[] = new RefundDetails(
					(int)($refund['externalId'] ?? 0),
                    $pdfUrl,
					$createdDate
				);
			} catch ( InvalidArgumentException $e ) {
				return new WP_Error( 'rest_invalid_argument', 'Invalid refund data: ' . $e->getMessage(), array( 'status' => 400 ) );
			} catch ( \Throwable $e ) {
				return new WP_Error( 'rest_internal_error', 'An error occurred: ' . $e->getMessage(), array( 'status' => 500 ) );
			}
		}

		try {
			$this->invoiceOrderDetailsService->addRefundDetails((int)$externalId, $refundDetails);
			return rest_ensure_response(array('message' => 'Refund details added successfully.'));
		} catch ( InvalidArgumentException $e ) {
			return new WP_Error( 'rest_invalid_argument', 'Invalid argument: ' . $e->getMessage(), array( 'status' => 400 ) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', 'An error occurred: ' . $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function addInvoiceOrderMeta( $request ) {
		$metaData = null;
		try {
			$params = $request->get_json_params();
			if (!is_array( $params ) || empty( $params )) {
				throw new InvalidArgumentException('Request body must be an array not empty');
			}

			$pdfUrl = sanitize_text_field($params['value'] ?? '');
			if ( !empty($pdfUrl) && is_string($pdfUrl) && preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $pdfUrl)) {
				$pdfUrl = StelService::STEL_API_MICROSERVICE_URL . 'resources/' . $pdfUrl;
			}
			$externalId = absint($request->get_param('id'));

			if ( !filter_var( $externalId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ) {
				throw new InvalidArgumentException('externalId must be a valid order ID: ' . $externalId);
			}

			if ( !filter_var($pdfUrl, FILTER_VALIDATE_URL) ) {
				throw new InvalidArgumentException('pdfUrl must be a valid URL');
			}


			$this->invoiceOrderDetailsService->updatePdfUrl((int)$externalId, $pdfUrl);

			return rest_ensure_response(array('message' => 'Meta data added successfully.'));
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function addSalesOrderPdf( WP_REST_Request $request ) {
		$pdfUrl = null;
		try {
			$params = $request->get_json_params();
			if (!is_array( $params ) || empty( $params )) {
				throw new InvalidArgumentException('Request body must be an array not empty');
			}

			$pdfUrl = sanitize_text_field($params['value'] ?? '');
			if ( !empty($pdfUrl) && is_string($pdfUrl) && preg_match("/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/", $pdfUrl)) {
				$pdfUrl = StelService::STEL_API_MICROSERVICE_URL . 'resources/' . $pdfUrl;
			}
			$externalId = absint($request->get_param('id'));

			if ( !filter_var( $externalId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ) {
				throw new InvalidArgumentException('externalId must be a valid order ID: ' . $externalId);
			}

			if ( !filter_var($pdfUrl, FILTER_VALIDATE_URL) ) {
				throw new InvalidArgumentException('pdfUrl must be a valid URL');
			}
			$this->invoiceOrderDetailsService->updateSalesOrderPdfUrl((int)$externalId, $pdfUrl);
			return rest_ensure_response(array('message' => 'Sales order PDF URL added successfully.'));
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
 

	public function get_webhooks( $request ) {
		$webhooks = null;
		try {
			$webhooks = $this->integrationService->getWebhooks();
			$webhooks = array_values(array_map(
				function( Subscription $subscription ) {
					return (new SubscriptionDTO(
						$subscription->getExternalId(),
						$subscription->getFields(),
						$subscription->getName(),
						$subscription->getProps(),
					))->__serialize();
				},
				$webhooks
			));
        	return rest_ensure_response($webhooks);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function get_integration_summary( $request ) {
		try {
			$summary = $this->integrationService->getIntegrationSummary();
			return rest_ensure_response( $summary );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	private function extractPaginationParams( WP_REST_Request $request ) {
		$firstElement =  filter_var( $request->get_param("firstElement") ?? 0, FILTER_VALIDATE_INT );
		if ( $firstElement === false || $firstElement < 0 ) {
			return new WP_Error( 'rest_invalid_argument', 'firstElement must be a non-negative integer.', array( 'status' => 400 ) );
		}
		$pageSize =  filter_var( $request->get_param("pageSize") ?? 30, FILTER_VALIDATE_INT );
		if ( $pageSize === false || $pageSize < 1) {
			return new WP_Error( "rest_invalid_argument", "pageSize must be a positive integer.", array( "status" => 400 ) );
		}
		return array($firstElement, $pageSize);
	} 

	public function getLogEvents( WP_REST_Request $request ) {
		try {
			list($firstElement, $pageSize) = $this->extractPaginationParams($request);
			return rest_ensure_response(  $this->integrationService->getEvents($firstElement, $pageSize));
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function get_integration_invoices(  WP_REST_Request $request ) {
		try {
			list($firstElement, $pageSize) = $this->extractPaginationParams($request);
			$invoices = $this->integrationService->getIntegrationInvoices( $firstElement, $pageSize );
			return rest_ensure_response( $invoices );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function get_integration_orders( WP_REST_Request $request ) {
		try {
			list($firstElement, $pageSize) = $this->extractPaginationParams($request);
			$invoices = $this->integrationService->getIntegrationOrders( $firstElement, $pageSize );
			return rest_ensure_response( $invoices );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function update_integration_config( WP_REST_Request $request ) {
		$integrationConfig = $request->get_json_params()["integrationConfig"] ?? null;
		if ( empty( $integrationConfig ) ) {
			return new WP_Error( "rest_invalid_argument", "integrationConfig must be provided", array( "status" => 400 ) );
		}
        /** Legacy order webhook that its managed locally by the plugin, use the prop legacyOrderSyncSubscription.
         * Newer webhooks (for example, product-related subscribers), that are managed in STEL side, They are located
         * in the integrationConfig property, within integration_module_config.
         * */
		$legacyOrderSyncSubscriptionData = $request->get_json_params()["legacyOrderSyncSubscription"] ?? null;
		if ( empty( $legacyOrderSyncSubscriptionData ) ) {
			return new WP_Error( "rest_invalid_argument", "legacyOrderSyncSubscription must be provided", array( "status" => 400 ) );
		}

		$saveWebhookDto = new SaveWebhookDto( $legacyOrderSyncSubscriptionData["sync"] ?? false,
			$legacyOrderSyncSubscriptionData["id"] ?? null,
			[],
			"order",
			[]
		);

		try {
			$subscription = $this->integrationService->updateIntegrationConfig($integrationConfig, $saveWebhookDto, get_current_user_id());

			$legacyOrderSyncSubscriptionResult = !$legacyOrderSyncSubscriptionData["sync"] || $subscription === null ? new SubscriptionDTO(
				null,
				$saveWebhookDto->getFields(),
				"order",
				$saveWebhookDto->getProps(),
				false

			) : new SubscriptionDTO(
				$subscription->getExternalId(),
				$saveWebhookDto->getFields(),
				"order",
				$saveWebhookDto->getProps()
			);


			return rest_ensure_response( array(
				"integrationConfig" => $integrationConfig,
				"availableIntegrationConfig" => $request->get_json_params()["availableIntegrationConfig"] ?? json_encode( (object) [], JSON_FORCE_OBJECT ),
				"legacyOrderSyncSubscription" => $legacyOrderSyncSubscriptionResult->__serialize(),
			) );
		}  catch ( \Throwable $e ) {
			return new WP_Error( "rest_internal_error", "An error occurred trying update the integrations configuration", array( "status" => 500 ) );
		}
		

	}

	public function get_integration_config( $request ) {
		try {
			$config = $this->integrationService->getIntegrationConfiguration();
			$legacyOrderSyncSubscription = $config["legacyOrderSyncSubscription"];
			if ($legacyOrderSyncSubscription instanceof Subscription) {
			  	$dto = new SubscriptionDTO(
					$legacyOrderSyncSubscription->getExternalId(),
					$legacyOrderSyncSubscription->getFields(),
					$legacyOrderSyncSubscription->getName(),
					$legacyOrderSyncSubscription->getProps()
				);
				$config["legacyOrderSyncSubscription"] = $dto->__serialize();
			} else {
				$dto = new SubscriptionDTO(null, [], "order", [], false);
			  	$config["legacyOrderSyncSubscription"] = $dto->__serialize();
			}
			return rest_ensure_response( $config );
		} catch ( \Throwable $e ) {
			error_log("Se ha producido un error al intentar obtener la configuración de la integración: " . $e->getMessage());
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function get_integration_documents( $request ) {
		try {
			$documents = $this->integrationService->getIntegrationDocuments();
			return rest_ensure_response( $documents );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	function check_auth_platform(\WP_REST_Request $request) {
        SecurityRestFilter::applyAuthFilter($request);
		return $this->wcWebhookService->check_user();
	}
	public function auth_platform($request) {

		return new WP_REST_Response(array(
			'message' => 'Authorization successful',
		), WP_Http::OK);
	}

	public function delete_integration(WP_REST_Request $request ) {
		$integrationId = sanitize_text_field($request->get_json_params()['integrationId']);
		try {
			$this->integrationService->deleteIntegration($integrationId);
			return rest_ensure_response( array('message' => 'Integration deleted successfully.') );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function delete_local_integration( WP_REST_Request $request ) {
		try {
			$this->integrationService->deleteLocalIntegration();
			return new WP_REST_Response(null, WP_Http::NO_CONTENT);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function pause_local_integration( WP_REST_Request $request ) {
		try {
			$this->integrationService->pauseLocalIntegration();
			return new WP_REST_Response(null, WP_Http::NO_CONTENT);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function pause_integration( WP_REST_Request $request ) {
		try {
			$this->integrationService->pauseIntegration();
			return rest_ensure_response(
				array('status' => 'PAUSED')
			);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function resume_local_integration( WP_REST_Request $request ) {
		try {
			$this->integrationService->resumeLocalIntegration();
			return new WP_REST_Response(null, WP_Http::NO_CONTENT);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function resume_integration( WP_REST_Request $request ) {
		try {
			$this->integrationService->resumeIntegration();
			return rest_ensure_response(
				array('status' => 'ACTIVE')
			);
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function reset_configuration( WP_REST_Request $request ) {
		try {
			$result = $this->integrationService->resetIntegrationConfiguration();
			return rest_ensure_response( 
				is_array($result) ? $result : []
			 );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function create_integration_access_token( WP_REST_Request $request ) {
		try {
			
			$tempIntegrationToken = $this->accountService->connectStelAccount();

			$register = rest_sanitize_boolean( $request->get_param('register') ?? false );

			$integrationHost = wp_parse_url(StelService::STEL_API_MICROSERVICE_URL, PHP_URL_HOST);
			$redirect_url = StelService::STEL_INTEGRATIONS_URL . '/app/'
				. ($register ? '#form=registro#tipoPlanSuscripcionGeneral=BUSINESS' : '')
				. '#tipoIntegracion=WOOCOMMERCE_VERIFACTU#tokenIntegracion=' . $tempIntegrationToken;

			$response = new WP_REST_Response(array(
				'redirectUrl' => $redirect_url
			), WP_Http::CREATED);

			return $response;
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function create_integration( $request ) {
		$createIntegrationDto = null;
		try {
			$params = $request->get_json_params();
			if (!is_array( $params ) || empty( $params )) {
				throw new InvalidArgumentException('Request body must be an array not empty');
			}
			$createIntegrationDto = new CreateIntegrationDTO($params['integration_id'] ?? '', $params['platform_id'] ?? '', $params['token'] ?? '');
			
			$integration = $this->accountService->connectAccount($createIntegrationDto, get_current_user_id());
			
			$siteDetails = SiteDetailsRepository::getInstance()->getSiteDetails();

			$response = array();

			if ( !empty($siteDetails->getDomain()) ) {
				$response['domain'] = $siteDetails->getDomain();
			}
			if ( !empty($siteDetails->getSiteName()) ) {
				$response['site_name'] = $siteDetails->getSiteName();
			}
			if ( !empty($siteDetails->getLogoUrl()) ) {
				$response['logo_url'] = $siteDetails->getLogoUrl();
			}

			return rest_ensure_response( $response );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	public function get_external_products( WP_REST_Request $request ): WP_Error|WP_REST_Response {
		$params = $request->get_json_params();
		if ( !is_array($params) || empty($params) ) {
			return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
		}

		try {
			$dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, QueryProductsDto::class);
			$externalProducts = ProductService::getInstance()->getProductsBy($dto);
			$externalProductsProjection = array();
			foreach ( $externalProducts as $externalProduct ) {
				if ( $externalProduct instanceof \WC_Product_Variation ) {
					$id = $externalProduct->get_parent_id() . '-' . $externalProduct->get_id();
				} else {
					$id = $externalProduct->get_id();
				}
				$externalProductsProjection[] = array(
					"id" => $id,
					"sku" => $externalProduct->get_sku(),
					"name" => $externalProduct->get_name(),
					"global_unique_id" => $externalProduct->get_global_unique_id()
				);
			}
			return rest_ensure_response( $externalProductsProjection );
		} catch ( InvalidArgumentException $e ) {
			return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
		} catch ( \Throwable $e ) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
				'status' => 500,
				'trace' => $e->getTraceAsString()
			) );
		}

	}

    public function check_external_product_exists( WP_REST_Request $request ): WP_Error|WP_REST_Response {
        $params = $request->get_json_params();
        if ( !is_array($params) || empty($params) ) {
            return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
        }

        try {
            $dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, ExistingProductById::class);
            $exists = ProductService::getInstance()->existsProduct($dto);
            return rest_ensure_response( array("exists" => $exists) );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
                'status' => 500,
                'trace' => $e->getTraceAsString()
            ) );
        }
    }

    public function save_external_product_images(WP_REST_Request $request): WP_Error|WP_REST_Response {
        $params = $request->get_json_params();
        if ( !is_array($params) || empty($params) ) {
            return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
        }

        try {
            $dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, SaveExternalProductImages::class);
            $product = ProductService::getInstance()->updateProductImages($dto);
            $productData = $product->get_data();
            if ( $product instanceof  \WC_Product_Variation ) {
                $productData["id"] = $product->get_parent_id() . '-' . $product->get_id();
            }
            return new WP_REST_Response( $productData );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( EntityNotFound ) {
            return new WP_Error( 'rest_entity_not_found', 'Product not found with the provided variation_id or parent_id', array( 'status' => 404 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
                'status' => 500,
                'trace' => $e->getTraceAsString()
            ) );
        }
    }

    public function save_external_product_stock(WP_REST_Request $request): WP_Error|WP_REST_Response {
        $params = $request->get_json_params();
        if ( !is_array($params) || empty($params) ) {
            return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
        }

        try {
            $dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, SaveExternalProductStock::class);
            $product = ProductService::getInstance()->updateProductStock($dto);
            $productData = $product->get_data();
            if ( $product instanceof  \WC_Product_Variation ) {
                $productData["id"] = $product->get_parent_id() . '-' . $product->get_id();
            }
            return new WP_REST_Response( $productData );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( EntityNotFound ) {
            return new WP_Error( 'rest_entity_not_found', 'Product not found with the provided variation_id or parent_id', array( 'status' => 404 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
                'status' => 500,
                'trace' => $e->getTraceAsString()
            ) );
        }
    }

    public function save_external_products( WP_REST_Request $request ): WP_Error|WP_REST_Response {
        $params = $request->get_json_params();
        if ( !is_array($params) || empty($params) ) {
            return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
        }

        try {
            $dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, SaveExternalProduct::class);
            $product = ProductService::getInstance()->saveProduct($dto);
			$productData = $product->get_data();
			$productData["external-id"] = $dto->externalId;
			if ($product instanceof \WC_Product_Variation) {
				$productData["id"] = $product->get_parent_id() . '-' . $product->get_id();
			}
            return new WP_REST_Response( $productData, WP_Http::CREATED );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( EntityNotFound ) {
            return new WP_Error( 'rest_entity_not_found', 'Product not found with the provided variation_id or parent_id', array( 'status' => 404 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
                'status' => 500,
                'trace' => $e->getTraceAsString()
            ) );
        }
    }

    public function create_local_subscription(WP_REST_Request $request ): WP_Error|WP_REST_Response
    {
        $params = $request->get_json_params();
        if ( !is_array($params) || empty($params) ) {
            return new WP_Error( 'rest_invalid_argument', 'Request body must be an array not empty', array( 'status' => 400 ) );
        }

        try {
            $dto = DTODeserializerValidator::getInstance()->deserializeAndValidate($params, CreateLocalSubscriptionDto::class);
            $dto->type = \WC_Webhook::class;
            $this->integrationService->createLocalSubscription($dto);

            return new WP_REST_Response( null, WP_Http::CREATED );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array(
                'status' => 500,
                'trace' => $e->getTraceAsString()
            ) );
        }
    }

    public function delete_local_subscription(WP_REST_Request $request ): WP_Error|WP_REST_Response
    {
        $name = $request->get_param('name') ?? null;
        if ( empty($name) || !in_array($name, ["order", "product"], true) ) {
            return new WP_Error( 'rest_invalid_argument', 'Name parameter is required and must be a string', array( 'status' => 400 ) );
        }

        try {

            $this->integrationService->deleteLocalSubscription($name);

            return new WP_REST_Response( null, WP_Http::NO_CONTENT );
        } catch ( InvalidArgumentException $e ) {
            return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
        } catch ( \Throwable $e ) {
            return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
        }
    }


	public function save_legacy_subscriptions(WP_REST_Request $request ) {
		$saveWebhookDtos = null;
		$deletedSubscription = array();
		try {
			$params = $request->get_json_params();
			if ( !is_array($params) || empty($params) ) {
				throw new InvalidArgumentException('Request body must be an array not empty');
			}
			$saveWebhookDtos =	array_map(function($dto) {
				if (!is_array($dto)) {
					throw new InvalidArgumentException('Request body must be an array of objects');
				}
				$newDto = new SaveWebhookDTO($dto['sync'], $dto['id'] ?? null, $dto['fields'], $dto['name'], $dto['props']);

				return $newDto;
			}, $params);
			// Obtenemos los DTOs de las suscripciones que van a ser eliminadas para tratarlas en la respuesta
			$deletedSubscription = array_filter(
				$saveWebhookDtos,
				function (SaveWebhookDto $dto) {
					$externalId = $dto->getExternalId();
					return $dto->getSync() === false && isset($externalId);
				}
			);
		} catch (InvalidArgumentException $e) {
			return new WP_Error( 'rest_invalid_argument', $e->getMessage(), array( 'status' => 400 ) );
		}
		$dtos = [];
		try {
			try {
				$subscriptions = $this->integrationService->saveLegacyWebhook($saveWebhookDtos, get_current_user_id());
				$dtos = array_map( function(Subscription $dto) use ($deletedSubscription) {
					$externalId = $dto->getExternalId();
					$sync = true;
					$fields = $dto->getFields();
					$props = $dto->getProps();
					// Obtenemos los IDs de las suscripciones a eliminar para realizar el tratamiento de la respuesta de las suscripciones eliminadas

					if ( !empty($deletedSubscription) ) {
						$deletedSubsId = array_map( function(SaveWebhookDTO $deleted) {
							return $deleted->getExternalId();
						} ,$deletedSubscription);


						if( in_array($dto->getExternalId(), $deletedSubsId) ) {
							$sync = false;
							$externalId = null;

							foreach ( $fields as $key => $value ) {
								$fields[$key] = false;
							}
							foreach ( $props as $key => $value ) {
								$props[$key] = false;
							}
						}
					}

					return (new SubscriptionDTO(
						$externalId,
						$fields,
						$dto->getName(),
						$props,
						$sync
					))->__serialize();
				}, $subscriptions);
			} catch (\Throwable $e) {
				return new WP_Error( 'rest_internal_error', 'Se ha producido un error al intentar guardar las suscripciones', array( 'status' => 500 ) );
			}

		} catch (\Throwable $e) {
			return new WP_Error( 'rest_internal_error', $e->getMessage(), array( 'status' => 500 ) );
		}
		// Aseguramos que se no se transforme en un array asociativo
		$webhookResult = $dtos ?
			array_values($dtos)
		: [];
		// Return all of our comment response data.
		return rest_ensure_response( $webhookResult );
	}

}



