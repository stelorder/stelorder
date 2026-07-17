<?php

namespace Stel\Verifactu\Services;

use Exception;

use InvalidArgumentException;
use Stel\Verifactu\App;
use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Services\DTOs\CreateIntegrationDTO;
use Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\SubscriptionType;
use Stel\Verifactu\Services\DTOs\SaveWebhookDTO;

class AccountService {
    private static ?AccountService $instance = null;
    private IntegrationService $integrationService;
    private ?WCWebhookService $wcWebhookService = null;
    private ?StelService $stelService = null;

    private function getWCWebhookService(): WCWebhookService {
        if ($this->wcWebhookService === null) {
            $this->wcWebhookService = WCWebhookService::getInstance();
        }
        return $this->wcWebhookService;
    }

    private function getStelService(): StelService {
        if ($this->stelService === null) {
            $this->stelService = StelService::getInstance();
        }
        return $this->stelService;
    }


    public static function getInstance(): AccountService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->integrationService = IntegrationService::getInstance();
    }

    public function connectAccount(CreateIntegrationDTO | null $data, int $wpUserId): Integration {
        // 1. Obtenemos la integración
        $integrationData = $this->integrationService->getIntegration();
        // 1.2. Si existe la devolvemos
        if ($integrationData !== null) {
            return $integrationData;
        }
        // 2. Creamos la integración
        $integration = $this->integrationService->createIntegration($data);
        // 3. Creamos la suscripción de pedidos y facturas
        $orderInvoiceSubscription = SaveWebhookDTO::build(SubscriptionType::INVOICE_ORDER);
       
        $subscriptions = $this->integrationService->saveLegacyWebhook([$orderInvoiceSubscription], $wpUserId);
        $integration->setSubscriptions($subscriptions);

        return $integration;
    }

    public function connectStelAccount(): string {
       // 1. Comprobamos si ya existe una integración creada
       $integration = $this->integrationService->getIntegration();

       if ($integration !== null) {
           throw new InvalidArgumentException('Already an integration exists.');
       }

       // 2. Si no existe, creamos el par de claves de la plataforma para la integración
       $platformKeys = $this->getWCWebhookService()->create_keys( App::NAME, 'read_write' );

       if ( is_wp_error($platformKeys) ) {
           throw new Exception('Error creating platform keys.');
       }

       // 3. Solicitamos el token temporal al microservicio, con las credenciales de la plataforma
       $tempToken = $this->getStelService()->requestTempToken( $platformKeys['consumer_key'], $platformKeys['consumer_secret'] );

       // 4. Devolvemos el token temporal y en la SPA, redirigimos al usuario a la URL de Stel para que autorice la integración
       return $tempToken;
    }

}
