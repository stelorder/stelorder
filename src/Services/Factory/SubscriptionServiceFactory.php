<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services\Factory;

use InvalidArgumentException;
use Stel\Verifactu\Services\SubscriptionService;

class SubscriptionServiceFactory {
    private static ?SubscriptionServiceFactory $instance = null;

    /**
    * @template T of object
    * @var array<class-string<T>, SubscriptionService>
    */
    private array $subscriberMap = [];
    private ?SubscriptionService $defaultSubscriber = null;
    private function __construct() {}

    public static function getInstance(): SubscriptionServiceFactory {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /** Register a subscriber instance for a given subscriber class. This allows the factory to return the correct instance when requested.
     * @template T of object
     * @param class-string<T> $subscriberClass The class name of the subscriber service to register.
     * @param SubscriptionService $subscriberInstance The instance of the subscriber service to register.
     * */
    public function registerSubscriber(string $subscriberClass, SubscriptionService $subscriberInstance): void {
        $this->subscriberMap[$subscriberClass] = $subscriberInstance;
    }

    /** Set the default subscriber instance to be returned when no specific subscriber class is requested. This allows for a fallback subscriber to be used when no specific subscriber is registered for a requested class.
     * @param SubscriptionService $subscriberInstance The instance of the subscriber service to set as the default.
     * */
    public function setDefaultSubscriber(SubscriptionService $subscriberInstance): void {
        $this->defaultSubscriber = $subscriberInstance;
    }

    /** Get the subscriber instance for a given subscriber class. This will return the registered instance for the requested subscriber class.
     * @template T of object
     * @param class-string<T> $subscriberClass The class name of the subscriber service to retrieve.
     * @return SubscriptionService The instance of the subscriber service registered for the requested class.
     * @throws InvalidArgumentException If no subscriber instance is registered for the requested class.
     * */
    public function getSubscriber(string $subscriberClass): SubscriptionService
    {
        if (isset($this->subscriberMap[$subscriberClass])) {
            return $this->subscriberMap[$subscriberClass];
        } elseif ($this->defaultSubscriber !== null) {
            return $this->defaultSubscriber;
        } else {
            throw new InvalidArgumentException("No subscriber registered for class: $subscriberClass");
        }

    }

}