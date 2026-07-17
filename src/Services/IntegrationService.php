<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Exception;
use InvalidArgumentException;
use RuntimeException;

use Stel\Verifactu\App;
use Stel\Verifactu\Controllers\DTOs\CreateLocalSubscriptionDto;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Domain\Subscription;
use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Repositories\IntegrationRepository;
use Stel\Verifactu\Services\DTOs\CreateIntegrationDTO;
use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;
use Stel\Verifactu\Services\Exceptions\IntegrationServiceException;
use Stel\Verifactu\Services\Factory\SubscriptionServiceFactory;

class IntegrationService {
    private static ?IntegrationService $instance = null; // Instancia única de la clase
    public const EVENTS  = array('updated');
    /**
     * Entities whose WooCommerce webhooks are still using the legacy subscriber
     * flow for backwards compatibility with the legacy STEL integration flow.
     * Newer subscriber types are managed asynchronously by STEL after the
     * integration configuration is updated on the STEL side.
     */
    private const LEGACY_WEBHOOK_MANAGED_ENTITIES = array('order');
    private  IntegrationRepository $integrationRepository;
    private  StelService $stelService;
    private  WCWebhookService $wcWebhookService;
    // Constructor privado para evitar la instanciación directa
    private SubscriptionServiceFactory $factory;
    private function __construct() {
        $this->integrationRepository = IntegrationRepository::getInstance();
        $this->stelService = StelService::getInstance();
        $this->wcWebhookService = WCWebhookService::getInstance();
        $this->factory = SubscriptionServiceFactory::getInstance();
    }

    public function resetIntegrationConfiguration() {
        $integration = $this->integrationRepository->get();
        return $this->executeTransaction(
            function (IntegrationRepository $repository) use ($integration) {
                return $this->stelService->resetConfiguration( $integration->getIntegrationId(), $integration->getToken() );
            }
        );
    }

    private function hasSubscriptionProps(array $subscriptions, string $propName): bool {
        return !empty(array_filter(
            $subscriptions,
            function (Subscription $subscription) use ($propName) {
                $props = $subscription->getProps();
                return !empty($props) && !empty($props[$propName]);
            }
        ));
    }

    public function getIntegrationSummary()
    {
        try {
            $integration = $this->integrationRepository->get();
            if (empty($integration)) {

                throw new EntityNotFound("Integration not found");
            }
            $summary = $this->stelService->getSummary($integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken());
            return $this->executeTransaction(
                function (IntegrationRepository $repository) use ($integration, $summary) {

                    $subscriptions = $integration->getSubscriptions();

                    $foundSubscriptions = array_filter(
                        $subscriptions,
                        function (Subscription $subscription) {
                            return $subscription->getName() === 'order';
                        }
                    );
                    // Obtenemos el primer elemento o null si no hay resultados
                    $subscription = !empty($foundSubscriptions) ? reset($foundSubscriptions) : null;

                    $exists = $subscription !== null ? ($this->stelService->checkExistsSubscriber($integration->getIntegrationId(), $subscription->getExternalId(), $integration->getToken())) : false;

                    if (!$exists) {
                        $summary['sync-orders'] = false;
                        $summary['sync-invoices'] = false;
                        $summary['sync-refund-invoices'] = false;
                    }

                    return $summary;
                }
            );
        } catch (Exception $e) {
            if ($e instanceof EntityNotFound) {
                $this->deleteLocalIntegration();
                throw $e;
            }
            throw new IntegrationServiceException("An error has occurred retrieving integration summary", $e);
        }
    }

    public function getIntegrationDocuments() {
        $integration = $this->integrationRepository->get();
        return $this->stelService->getDocuments( $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken() );
    }

    public function getIntegrationInvoices(int $firstElement, int $pageSize) {
        $integration = $this->integrationRepository->get();
        return $this->stelService->getInvoices( $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken(), $firstElement, $pageSize );
    }

    public function getIntegrationOrders(int $firstElement, int $pageSize) {
        $integration = $this->integrationRepository->get();
        return $this->stelService->getOrders( $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken(), $firstElement, $pageSize );
    }

    public function getIntegrationConfiguration() {
        $integration = $this->integrationRepository->get();
        $verifactuConfig = $this->stelService->getPlatformVerifactuConfig( $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken() );
        $config = $this->stelService->getAvailableConfiguration( $integration->getIntegrationId(), $integration->getToken() );

        $foundSubscriber = array_filter( 
            $this->getWebhooks(),
            function( $sub ) {
                return $sub->getName() === 'order';
            }
        );
        $subscriber = !empty($foundSubscriber) ? reset($foundSubscriber) : null;


        error_log("Subscriber found: " . print_r($subscriber, true));

        $config["legacyOrderSyncSubscription"] = $subscriber;

        $config["verifactuConfig"] = $verifactuConfig;

        return $config;

    }

    /**
     * Updates the integration configuration in STEL and synchronizes local webhook state when required.
     *
     * Integration architecture note:
     * - STEL is the source of truth for the integration configuration and subscriber definitions.
     * - Newer synchronization subscribers (for example, product-related subscribers) are managed
     * asynchronously by STEL after the integration configuration is updated on the STEL side.
     * In those cases, STEL later calls the plugin endpoint responsible for creating/deleting the
     * corresponding local WooCommerce webhook.
     * - Order subscriptions are still managed locally by the plugin for backwards compatibility
     * with the legacy STEL integration flow used by existing installations.
     *
     * This split is a legacy compatibility concern only. In the future,
     * it will be completely replaced by the newer subscription flow
     *
     * @param array $integrationConfig Integration sync configuration to be updated
     * @param SaveWebhookDTO $ordersSyncDto Legacy order webhook info to be created locally
     * @param int $userId User id that will create the order webhook
     * @return Subscription|null The legacy local order webhook that has been creaated
     */
    public function updateIntegrationConfig(array $integrationConfig, SaveWebhookDTO $ordersSyncDto, int $userId): Subscription|null
    {
        $integration = $this->integrationRepository->get();
        $this->stelService->updateIntegrationConfig($integration->getIntegrationId(), $integrationConfig, $integration->getToken());

        return $this->executeTransaction(
            function (IntegrationRepository $repository) use ($ordersSyncDto, $userId) {
                

                // Actualizamos el webhook de sincronización de pedidos
                return $this->saveLegacyWebhook(array($ordersSyncDto), $userId)[0];
            }
        );
    }

    public function getEvents(int $firstElement = 0, int $lastElement = 30): array {
        $integration = $this->integrationRepository->get();
        return $this->stelService->getEvents($integration->getIntegrationId(), $integration->getToken(), $firstElement, $lastElement);
    }

    public function deleteIntegration( string $integrationId ) {
        if ( empty( $integrationId ) || !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $integrationId) ) {
            throw new InvalidArgumentException('Integration ID must not be empty and must be a valid UUID.');
        }
        // Comprobamos si existe la integración
        $integration = $this->integrationRepository->get();
        if ( empty($integration) ) {
            throw new EntityNotFound("Integration not found");
        }
        // Comprobamos si el id de la integración coincide con el proporcionado
        if ( $integration->getIntegrationId() !== $integrationId ) {
            throw new InvalidArgumentException('The integration ID does not match the one provided.');
        }
        
        // Eliminamos la integración de wordpress y del microservicio
        $this->executeTransaction(function (IntegrationRepository $repository) use ($integrationId, $integration) {
            try {
                error_log(json_encode(value: $integration->getSubscriptions()));
                $this->stelService->deleteIntegration( $integrationId, $integration->getToken() );
                $this->deleteLocalIntegration( );
            } catch ( Exception $e ) {
                if ( $e instanceof EntityNotFound ) {
                    $this->deleteLocalIntegration( );
                    Logger::addLog( "Integration doesn't exist in the microservice, deleting from wordpress" );
                }
            }
        });
    }

    public function pauseIntegration() {
        try {
            $integration = $this->integrationRepository->get();
            if ( $integration === null ) {
                throw new EntityNotFound("Integration not found");
            }
            $this->stelService->pauseIntegration( $integration->getIntegrationId(), $integration->getToken() );
            $this->pauseLocalIntegration();
        } catch ( Exception $e ) {
            throw new IntegrationServiceException("An error has occurred pausing integration", $e);
        }
    }

    public function resumeIntegration() {
        try {
            $integration = $this->integrationRepository->get();
            if ( $integration === null ) {
                throw new EntityNotFound("Integration not found");
            }
            $this->stelService->resumeIntegration( $integration->getIntegrationId(), $integration->getToken() );
            $this->resumeLocalIntegration();
        } catch ( Exception $e ) {
            throw new IntegrationServiceException("An error has occurred resuming integration", $e);
        }
    }

    public function deleteLocalIntegration( ) {
        $this->integrationRepository->delete();
    }

    public function getIntegration(): Integration | null {
        $integrationData = null;
        try {
            $integrationData = $this->_getIntegration()["integration"];
        } catch (Exception $e) {
            if ($e instanceof EntityNotFound) {
                return null;
            }
            throw new IntegrationServiceException("An error has occurred retrieving integration data", $e);
        }
        return $integrationData;
    }

    private function getLocalWebhookIds() {
        $integration = $this->integrationRepository->get();
        if ( $integration === null ) {
            throw new EntityNotFound("Integration not found");
        }
        $localIds = array_merge(...array_map(function (Subscription $subscription) {
            return $subscription->getLocalIds();
        }, $integration->getSubscriptions()));
        return $localIds;
    }

    public function pauseLocalIntegration() {
        $localIds = $this->getLocalWebhookIds();
        $this->wcWebhookService->pauseWebhooks( $localIds );
    }

    public function resumeLocalIntegration() {
        $localIds = $this->getLocalWebhookIds();
        $this->wcWebhookService->resumeWebhooks( $localIds );
    }

    public function createIntegration(CreateIntegrationDTO $dto): Integration {
        // Comprobamos si ya existe una integración
        $existsIntegration = $this->integrationRepository->get();
        if ( !empty($existsIntegration)) {
            throw new RuntimeException("Integration already exists.");
        }

        return $this->executeTransaction(function (IntegrationRepository $repository) use ($dto) {
            $integration = new Integration(
                $dto->getIntegrationId(),
                $dto->getToken(),
                $dto->getPlatformId(),
                array()
            );
            $result = $repository->save($integration);
            if (!$result) {
                throw new IntegrationServiceException("An error occurred saving integration data");
            }
            return $integration;
        });
    }

    // Método para ejecutar operaciones en una "transacción"
    public function executeTransaction(callable $callback, ?callable $rollback = null) {
        $backup = $this->integrationRepository->get();
        try {
            $result = $callback($this->integrationRepository);
            return $result;
        } catch (Exception $e) {
            if (!empty($rollback) && is_callable($rollback)) {
                $rollback($this->integrationRepository);
            }
            $this->integrationRepository->save( $backup);
            error_log('Realizando rollback por: '.$e->getMessage());
            throw new Exception('An error occurred while executing the transaction.', 0, $e);
        }
    }

    // Método para obtener la instancia única
    public static function getInstance(): IntegrationService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // TODO: Refactorizar la función para separar las responsabilidades del mapeo y de la adaptación de la respuesta
    public function getWebhooks(): array {
        $integration = $this->integrationRepository->get();
        if ( empty($integration) ) {
            return array();
        }

        $subscriptions = $integration->getSubscriptions() ?? array();
        $webhookNames = array();
        $webhooksId = array();
        $webhookProps = array();
        // Almacenamos los identificadores de las suscripciones en local
        // También almacenamos las asociaciones de los nombres y los webhooks de woocommerce
        $localExternalId = array_reduce($subscriptions, function( array $carry, Subscription $webhook) use (&$webhookNames, &$webhooksId, &$webhookProps)  {
            $wbId = $webhook->getExternalId();
            
            $carry[] = $wbId;
            $webhooksId[$wbId] = $webhook->getLocalIds();
            $props = $webhook->getProps();
            // Almacenamos las propiedades del webhook
            if ( !empty($props) ) {
                $webhookProps[$wbId] = $props;
            } else {
                $webhookProps[$wbId] = array();
            }
            // Asociamos el externalId con el nombre del webhook
            $webhookNames[$wbId] = $webhook->getName();
            return $carry;
        }, []);
        
        $externalWbs = array();
        try {
            // Obtenemos las suscripciones del microservicio
            $externalWbs = $this->stelService->getWebhooks( $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken() );
            // Los procesamos y almacenamos sus identificadores
            $externalWbIds = array_map( function($webhook) {
                $wbId = $webhook["subscriber_id"];
                if ( empty ($wbId) ) {
                    throw new InvalidArgumentException("Webhook ID must not be empty.");
                }
                return $wbId;
            }, $externalWbs);

            // Obtenemos la diferencia entre los webhooks de woocommerce y los del microservicio, y los eliminamos
            $diff = array_merge(array_diff($externalWbIds, $localExternalId)
            , array_diff($localExternalId, $externalWbIds));

            error_log("Exist diff ? ". json_encode($diff) ) ;
            error_log('Printing $webhooksId: '.json_encode($webhooksId));

            if ( !empty( $diff )) {
                $externalWbs = $this->executeTransaction(function (IntegrationRepository $repository) use ( $diff, $webhooksId, $integration, $externalWbs, $externalWbIds, $localExternalId) {
                    foreach ($diff as $id) {
                        // 1. Borramos el webhook en el microservicio
                        try {
                            if (in_array( $id, $externalWbIds )) {
                                $this->stelService->deleteWebhook( $integration->getIntegrationId(), $id, $integration->getToken() );
                            }
                        } catch (Exception $e) {
                            if ( !($e instanceof EntityNotFound) ) {
                                throw $e;
                            }
                        }
                    }
                    // TODO: Desactivar la sincronización de facturas y pedidos en la configuración de la integración
                    
                    foreach ($diff as $id) {
                        if (in_array( $id, $localExternalId )) {
                            error_log('Deleting webhook in woocommerce '. print_r($webhooksId[$id], true));
                            // 2. Borramos el webhook en woocommerce
                            foreach ($webhooksId[$id] as $wbId) {
                                try {
                                    $this->wcWebhookService->deleteWCWebhook($wbId);
                                } catch (Exception $e) {
                                    Logger::addLog( "Error deleting webhook in woocommerce: " . $e->getMessage() );
                                }
                            }
                        }
                    }
                    // 3. Eliminamos los webhooks del plugin y actualizamos las opciones
                    $subscriptions = $integration->getSubscriptions();
                    foreach ($subscriptions as $key => $webhook) {
                        if (in_array($webhook->getExternalId(), $diff)) {
                            unset($subscriptions[$key]);
                        }
                    }
                    $integration->setSubscriptions($subscriptions);
                    $repository->save($integration);
                    // Devolvemos los externalwbs que no se encuentren en diff
                    return array_filter($externalWbs, function($webhook) use ($diff) {
                        return !in_array($webhook["subscriber_id"], $diff);
                    });
                });
            }

        } catch (Exception $e) {
            if ($e instanceof EntityNotFound) {
                $this->deleteIntegration($integration->getIntegrationId());
                Logger::addLog( "Integration doesn't exist in the microservice, deleting from wordpress" );
            }
            throw $e;
        }

        // Devolvemos los external webhooks mapeados
        // TODO: Migrar a una mapeador

        return array_map( function($webhook) use ($webhookNames, $webhookProps, $webhooksId) {
            $externalId = $webhook["subscriber_id"];
            $localIds = $webhooksId[$externalId];
            $name = $webhookNames[$externalId];
            $props = $webhookProps[$externalId] ?? array();
            $fieldsNames = array_values(array_filter(
                array_map(
                    // Indicamos que queremos obtener los nombres de los campos sincronizados
                    function($field) {
                    return $field["source_field"];
                }, $webhook["mapped_fields"]),
                // Filtramos los campos excluidos
                function($field) use ($webhookNames, $externalId) {
                    $excludeFields = StelService::MUST_FIELDS[$webhookNames[$externalId]] ?? null;
                    if ($excludeFields === null) {
                        return true;
                    }
                    return !in_array($field, $excludeFields);
                }
            ));
            // Creamos la asociación array<string, bool>
            $fields = array();
            foreach ($fieldsNames as $fieldName) {
                $fields[$fieldName] = true;
            }

            return new Subscription(
                $localIds,
                $externalId,
                $name,
                $props,
                $fields
            );
        }, $externalWbs);
    }

    /**
     * Persists the legacy local WooCommerce webhook used for backwards-compatible
     *  order synchronization flows.
     * @param array $saveWebhookDtos subscription dto list to update
     * @param int $userId WordPress user ID
     * @return Subscription[] existing subscriptions that has already been saved. Not include deleted ones
     *@throws \InvalidArgumentException if dto list is not an array or is empty
     */
    public function saveLegacyWebhook(array $saveWebhookDtos, int $userId) {
        if ( !is_array($saveWebhookDtos) || empty($saveWebhookDtos) ) {
            throw new InvalidArgumentException('The array must not be empty.');
        }
        $result = array();
        // Obtenemos el estado de la integración antes de modificar las suscripciones
        $integrationData = $this->_getIntegration();
        $integration = $integrationData['integration'];
        $status = $integrationData['status'];

        $newSubscriptions = array();
        // Creamos las nuevas suscripciones
        foreach ($saveWebhookDtos as $dto) {
            if (!$dto instanceof SaveWebhookDto) {
                throw new InvalidArgumentException('Each item in the array must be an instance of SaveWebhookDto.');
            }
            if ( !in_array($dto->getName(), self::LEGACY_WEBHOOK_MANAGED_ENTITIES) ) {
                throw new InvalidArgumentException('The name must be one of the following: ' . implode(', ', self::LEGACY_WEBHOOK_MANAGED_ENTITIES));
            }
            
            if ( empty($dto->getExternalId()) && $dto->getSync() === true) {
               $newSubscriptions[] = $dto;
            } 
        }

        // Creamos las nuevas suscripciones
        if ( !empty($newSubscriptions) ) {
            $created = $this->createLegacyWebhook($newSubscriptions, $integration, $userId);
            if ( !empty($created) ) {
                array_push($result, ...$created);
            }      
        }

        // Actualizamos las suscripciones existentes. Para ello:
        // Filtramos los webhooks que ya existan para realizar la actualización
        $webhooks = array_filter($saveWebhookDtos, function($dto) {
            return !empty($dto->getExternalId());
        });

        // Diferenciamos entre los webhooks que se van a actualizar y los que se van a eliminar
        $updateWbs = array_filter($webhooks, function($dto) {
            return $dto->getSync();
        });
        $deleteWbs = array_filter($webhooks, function($dto) {
            return !$dto->getSync();
        });

        
        if ( !empty($updateWbs) ) {
            // No hay records que actualizar en el microservicio, así que solo obtenemos los locales
            $updated = $this->fetchLocalSubscriptionsByIds(
                array_map( function(SaveWebhookDTO $dto) {
                    return $dto->getExternalId();
                }, $updateWbs)
            );
            if (!empty($updated)){
                array_push($result, ...$updated);
            }
        }

        if ( !empty($deleteWbs) ) {
            error_log("Deleting subscriptions...");
            $deleted = $this->deleteLegacyWebhook($deleteWbs);
            error_log("Deleted: " . print_r($deleted, true));
            if (!empty($deleted)){
                array_push($result, ...$deleted);
            }
        }

        if (!empty($result) && $status !== "ACTIVE") {
            $this->pauseLocalIntegration();
        }

        return $result;
    }

    /**
     * @throws EntityNotFound
     * @throws Exception
     */
    public function createLocalSubscription(CreateLocalSubscriptionDto $dto): void
    {
        // 1. Comprobamos si ya existe el suscriptor
        $integration = $this->integrationRepository->get();
        if ( $integration === null ) {
            throw new EntityNotFound("Integration not found");
        }
        if ( $integration->hasSubscription( $dto->name )) {
            throw new InvalidArgumentException("Subscription already exists");
        }
        // 2. Creamos el suscriptor localmente
        $this->executeTransaction(function(IntegrationRepository $repository) use ($integration, $dto) {

            $subscriptions = $integration->getSubscriptions();
            $subscriptions[] = $this->factory
                ->getSubscriber($dto->type)
                ->createLocalSubscription($dto, $integration, self::EVENTS);
            $integration->setSubscriptions($subscriptions);
            $repository->save($integration);
        });
    }

    /**
     * @throws EntityNotFound
     * @throws Exception
     */
    public function deleteLocalSubscription(string $name): void {
        $integration = $this->integrationRepository->get();
        if ( $integration === null ) {
            throw new EntityNotFound("Integration not found");
        }

        $this->executeTransaction(function(IntegrationRepository $repository) use ($integration, $name) {
            $subscription = $integration->deleteSubscription($name);
            if ( $subscription === null ) {
                return;
            }
            $this->factory
                ->getSubscriber($subscription->getName())
                ->deleteLocalSubscription($subscription);

            $repository->save($integration);
        });
    }

    /**
     * Crea un webhook legacy en woocommerce y en el microservicio por cada evento (create, update, delete) para un tipo de entidad
     * @param SaveWebhookDto[] $dto
     * @param Integration $integration
     * @param int $userId
     * @throws \InvalidArgumentException si ya existe un webhook con el mismo nombre
     * @return Subscription[] Devuelve un array con los webhooks creados
     */
    private function createLegacyWebhook(array $createWbDTOs, Integration $integration, int $userId) {
        
        // Comprobamos si ya existe un webhook con el mismo nombre
        $subscriptions = $integration->getSubscriptions() ?? array();
        foreach ($subscriptions as $subscription) {
            foreach ($createWbDTOs as $dto) {
                if (strpos($subscription->getName(), $dto->getName()) !== false) {
                    throw new InvalidArgumentException('A webhook with the same name already exists.');
                }
            }
        }

        $persistentWebhooks = array();
        return $this->executeTransaction(function(IntegrationRepository $repository) use ($createWbDTOs, $integration, $userId, &$persistentWebhooks) {
            // 1. Creamos la suscripción en el microservicio
            // 1.1 Creamos el webhook en el microservicio
            $externalWebhook = $this->stelService->createWebhooks(
                array_map( function(SaveWebhookDTO $dto)  {
                    return array(
                        "name" => $dto->getName(),
                        "fields" => array_keys($dto->getFields()),
                    );
                }, $createWbDTOs)
            , $integration->getIntegrationId(), $integration->getPlatformId(), $integration->getToken());
            // 1.2 Inicializamos las suscripciones y almacenamos el externalId y el nombre
            foreach ($externalWebhook as $externalWb) {
                $name = explode(".", $externalWb["topic"])[1];
                $mappedFields = array_map(function($field) {
                    return $field["source_field"];
                }, $externalWb["mapped_fields"]);

                $fields = array();
                foreach ($mappedFields as $field) {
                    $fields[$field] = true;
                }

                // Buscamos al DTO asociado al suscriptor que se acaba de crear por la propiedad name
                $searchDto = array_filter($createWbDTOs, function(SaveWebhookDTO $dto) use ($name) {
                    return $dto->getName() === $name;
                });
                // Lo extraemos de la búsqueda
                $resultDto = array_shift($searchDto);

                // TODO: Migrar la información necesaria para persistir las suscripciones en el plugin a una clase
                $persistentWebhooks[] = array(
                    "name" => $name,
                    "externalId" => $externalWb["subscriber_id"],
                    "webhookId" => array(),
                    "props" => $resultDto ? $resultDto->getProps() : array(),
                    "fields"=> $fields,
                );
            }
            
            // 2. Creamos webhooks (según el número de eventos) de woocommerce para cada una de las suscripciones del microservicio
            
            foreach ($persistentWebhooks as &$pWb) {
                foreach (IntegrationService::EVENTS as $event) {
                    // 2.1 Creamos el webhook en woocommerce
                    $wcWebhook = $this->wcWebhookService->createWCWebhook(
                        StelService::STEL_API_MICROSERVICE_URL . "integrations/{$integration->getIntegrationId()}/events}",
                       "{$pWb["name"]} {$event}",
                      "{$pWb["name"]}.{$event}",
                      $userId
                      );
                    // 2.2 Almacenamos el webhookId en el webhook actual
                    $pWb["webhookId"][] = $wcWebhook->get_id();
                }
            }

            $subscriptions = $integration->getSubscriptions();
            // 3. Actualizamos la integración local obtenida del repsotorio
            array_push($subscriptions, ...array_map(
                function($webhook) {
                    return new Subscription(
                        $webhook["webhookId"] ?? array(),
                        $webhook["externalId"],
                        $webhook["name"],
                        $webhook["props"] ?? array(),
                        $webhook["fields"] ?? array()
                    );
                }, $persistentWebhooks
            ));
            $integration->setSubscriptions($subscriptions);
            error_log('Creando integracion: ' . print_r($integration, true));
            // 4. Persistimos la integración local de wordpress
            $repository->save($integration);
            
            return array_map(
                function($webhook) {
                    

                    return new Subscription(
                        $webhook["webhookId"] ?? array(),
                        $webhook["externalId"],
                        $webhook["name"],
                        $webhook["props"] ?? array(),
                        $webhook["fields"] ?? array()
                    );
                }, $persistentWebhooks
            );
        }, function(IntegrationRepository $repository) use (&$persistentWebhooks, $integration) {
            // Si se produce una excepción, eliminamos los webhooks que se hayan creado en woocommerce y en el microservicio
            if ( empty($persistentWebhooks) ) return;
            // 1. Eliminamos las suscripciones del microservicio
            try {   
                $externalWebhookIds = array_map(
                    function ($webhook) {
                        return $webhook["externalId"];
                    },
                    $persistentWebhooks
                );
                $this->stelService->deleteWebhooks($integration->getIntegrationId(), $externalWebhookIds, $integration->getToken());
            } catch (Exception $e) {
                Logger::addLog( "Se ha producido un error al intentar deshacer la transacción de eliminación de la suscripción en el microservicio" );
            }

            // 2. Eliminamos los webhooks de woocommerce
            foreach ($persistentWebhooks as $pWb) {
                if (!empty($pWb["webhookId"])) {
                    foreach ($pWb["webhookId"] as $id) {
                        try {
                            $this->wcWebhookService->deleteWCWebhook($id);
                            Logger::addLog( "Deshaciendo la transacción: Webhook eliminado en woocommerce" );
                        } catch (Exception $e) {
                            Logger::addLog( "Se ha producido un error al intentar deshacer la transacción de eliminación del webhook en woocommerce" );
                        }
                    }
                }
            }
        });
    }

    /**
     * Updates the webhooks in the integration.
     * @param SaveWebhookDTO[] $saveWebhookDTOs
     * @throws \RuntimeException
     * @return Subscription[]
     */
    private function updateWebhook(array $saveWebhookDTOs) {
        // Operamos sobre la última versión de la integración local
        $integration = $this->integrationRepository->get();
        error_log('Obteniendo integracion: ' . print_r($integration, true));
        // 1. Comprobamos que las suscripciones existan en el estado inicial de la integración

        if ( !isset($integration) || empty($integration->getSubscriptions()) ) {
            throw new RuntimeException("No webhooks found to update.");
        }
        
        $subscriptionIds = array_map(
            function (Subscription $webhook) {
                return $webhook->getExternalId();
            },
            $integration->getSubscriptions()
        );

        $requestWbIds = array_map( 
            function (SaveWebhookDTO $wb) {
                return $wb->getExternalId();
            },
            $saveWebhookDTOs
        );

        foreach ($requestWbIds as $id) {
            if (!in_array($id, $subscriptionIds)) {
                throw new RuntimeException("Some webhooks do not exist.");
            }
        }

        // 2. Actualizamos las suscripciones en el microservicio
        $resultIds = $this->stelService->updateWebhook($integration->getIntegrationId(), $saveWebhookDTOs, $integration->getToken());

        // 2.1 Actualizamos las propiedades de las suscripciones en el plugin
        $persistentWebhooks = array();
        foreach ($saveWebhookDTOs as $dto) {
            // 2.1.1 Obtenemos el webhook del plugin que se va a actualizar
            $subscriptions = array_filter(
                $integration->getSubscriptions(),
                function (Subscription $subscription) use ($dto) {
                    return $subscription->getExternalId() === $dto->getExternalId();
                }
            );
            if ( !empty($subscriptions) ) {
                $subscription = array_shift($subscriptions);
                // 2.1.2 Actualizamos sus propiedades y los mapping fields
                $subscription->setProps($dto->getProps() ?? array());
                $subscription->setFields($dto->getFields() ?? array());
                $externalId = $subscription->getExternalId();
                $persistentWebhooks[$externalId] = $subscription;
            }
        }

        // 2.1.3 Actualizamos las suscripciones en el plugin
        $integration->setSubscriptions(array_map(
            function (Subscription $subscription) use ($persistentWebhooks) {
                if (isset($persistentWebhooks[$subscription->getExternalId()])) {
                    $subscription = $persistentWebhooks[$subscription->getExternalId()];
                }
                return $subscription;
            },
            $integration->getSubscriptions()
        ));
        
        error_log('Actualizando integracion: ' . print_r($integration, true));
        $this->integrationRepository->save($integration);
        
        // 3. Eliminamos los webhooks que no existan en el microservicio
        $diff = array_diff($requestWbIds, $resultIds);
        if ( !empty( $diff ) ) {
            $this->executeTransaction(
                function (IntegrationRepository $repository) use ($diff, $integration) {
                    // 3.1 Obtenemos las suscripciones del plugin que se van a eliminar
                    $toDeleteWbs = array_filter(
                        $integration->getSubscriptions(),
                        function (Subscription $subscription) use ($diff) {
                            return in_array($subscription->getExternalId(), $diff);
                        }
                    );
                    // 3.2 Eliminamos los webhooks de woocommerce
                    foreach ($toDeleteWbs as $wb) {
                        foreach ($wb->getLocalIds() as $wcWebhook) {
                            try {
                                $this->wcWebhookService->deleteWCWebhook($wcWebhook);
                            } catch (Exception $e) {
                                Logger::addLog( "Error deleting webhook in woocommerce: " . $e->getMessage() );
                            }
                        }
                    }
                    // 3.3 Eliminamos las suscripciones de la variable integration y la persistimos
                    $integration->setSubscriptions(array_filter(
                        $integration->getSubscriptions(),
                        function (Subscription $subscription) use ($diff) {
                            return !in_array($subscription->getExternalId(), $diff);
                        }
                    ));
                    $repository->save($integration);

                }, function (IntegrationRepository $repository) {
                    Logger::addLog( "Se ha producido un error al intentar deshacer la transacción de actualización de la suscripción en el microservicio" );
                }
            );
        }

        // 4 Devolvemos los webhooks actualizados
        $resultSubscriptions = array_filter(
            $integration->getSubscriptions(),
            function (Subscription $subscription) use ($diff, $requestWbIds) {
                // Comprobamos que la suscripción no esté en la lista de eliminaciones y que esté en la lista de IDs de suscripciones a actualizar
                return !in_array($subscription->getExternalId(), $diff) && in_array($subscription->getExternalId(), $requestWbIds);
            }
        );

        return $resultSubscriptions;
    }
    
    /**
     * Fetch local subscriptions by their external IDs
     * @param array $subscriptionIds
     * @return Subscription[]
     */
    private function fetchLocalSubscriptionsByIds(array $subscriptionIds): array {
        $integration = $this->integrationRepository->get();
        if ( !isset($integration) || empty($integration->getSubscriptions()) ) {
            return [];
        }

        $subscriptions = array_filter(
            $integration->getSubscriptions(),
            function (Subscription $subscription) use ($subscriptionIds) {
                return in_array($subscription->getExternalId(), $subscriptionIds);
            }
        );

        return $subscriptions;
    }


    /**
     * Elimina las suscripciones legacy en el microservicio y en woocommerce
     * @param SaveWebhookDTO[] $deleteWebhooksDTOs
     * @throws \RuntimeException
     * @return Subscription[] Devuelve los dtos de las suscripciones eliminadas con sync a false y cada field a false también
     */
    private function deleteLegacyWebhook(array $deleteWebhooksDTOs) {
        // Obtenemos la última versión de la integración local
        $integration = $this->integrationRepository->get();
        // Comprobamos que existen suscripciones en el estado inicial de la integración
        if ( !isset($integration) || empty($integration->getSubscriptions()) ) {
            throw new RuntimeException("No webhooks found to update.");
        }

        $subscriptions = $integration->getSubscriptions();
        // TODO: Refactorizar a una función privada
        $subscriptionIds = array_map(
            function (Subscription $subscription) {
                return $subscription->getExternalId();
            },
            $subscriptions
        );

        $requestWbIds = array_map( 
            function (SaveWebhookDTO $wb) {
                return $wb->getExternalId();
            },
            $deleteWebhooksDTOs
        );

        foreach ($requestWbIds as $id) {
            if (!in_array($id, $subscriptionIds)) {
                throw new RuntimeException("Some webhooks do not exist: {$id}");
            }
        }

        $this->executeTransaction(
            function (IntegrationRepository $repository) use ( $requestWbIds, $integration) {
                // 1. Eliminamos las suscripciones en el microservicio
                $this->stelService->deleteWebhooks( $integration->getIntegrationId(), $requestWbIds, $integration->getToken() );
                // 2. Eliminamos las suscripciones que se han proporcionado por parámetro en local
                // Obtenemos los webhooks que se van a eliminar
                $localSubscriptions = array_filter(
                    $integration->getSubscriptions(),
                    function (Subscription $subscription) use ($requestWbIds) {
                        return in_array($subscription->getExternalId(), $requestWbIds);
                    }
                );
                // Eliminamos los webhooks de woocommerce
                foreach ($localSubscriptions as $wb) {
                    foreach ($wb->getLocalIds() as $wcId) {
                        try {
                            $this->wcWebhookService->deleteWCWebhook($wcId);
                        } catch (Exception $e) {
                            Logger::addLog( "Error deleting webhook in woocommerce: " . $e->getMessage() );
                        }
                    }
                }
                // 3. Eliminamos las suscripciones de la variable integration y la persistimos
                $integration->setSubscriptions(array_filter(
                    $integration->getSubscriptions(),
                    function (Subscription $subscription) use ($requestWbIds) {
                        return !in_array($subscription->getExternalId(), $requestWbIds);
                    }
                ));
                $repository->save($integration);
            }, function (IntegrationRepository $repository) {
                Logger::addLog( "Se ha producido un error al intentar deshacer la transacción de eliminación de la suscripción en el microservicio" );
            });

        // 4. Devolvemos las suscripciones eliminadas

        return array_filter($subscriptions, function (Subscription $subscription) use ($requestWbIds) {
            return in_array($subscription->getExternalId(), $requestWbIds);
        });
    }
    
    /**
     * Fetch integration data from local and from external stel service
     * @throws EntityNotFound
     * @return array{integration: Integration, status: mixed}
     */
    private function _getIntegration(): array {
        // Comprobamos si existe la integración en wordpress y en el microservicio
        // 1 Comprobamos si existe en wordpress
        $integration = $this->integrationRepository->get();
        if ( !isset($integration) ) {
            throw new EntityNotFound("Integration not found");
        }
        // 2 Comprobamos si existe en el microservicio
        // Si la integración no existe en el repositorio, stelService lanza una excepción
        $externalIntegration = null;
        try {
            $externalIntegration = $this->stelService->getIntegration($integration->getIntegrationId(), $integration->getToken());
        } catch (Exception $e) {
            if ($e instanceof EntityNotFound) {
                // Si no existe la integración en el microservicio, la eliminamos de wordpress, incluyendo wooCommerce
                $this->deleteLocalIntegration();
            }
            throw $e;
        }

        return [
            "integration" => $integration,
            "status" => $externalIntegration["status"] ?? ""
        ];

    }

}
