<?php

namespace Stel\Verifactu\Domain;
use Exceptions;
use InvalidArgumentException;
use Stel\Verifactu\Controllers\Utils\ArrayUtils;

class Integration {
    private string $integrationId;
    private string $token;
    private string $platformId;
    /**
     * Summary of subscriptions
     * @var Subscription[]
     */
    private array $subscriptions;

    public function __construct(string $integrationId, string $token, string $platformId, array $subscriptions) {
        if ( !Utils::checkIsValidUUID($integrationId) ) {
            throw new InvalidArgumentException('Integration ID must be a valid UUID.');
        }
        if ( !Utils::checkIsValidUUID($platformId) ) {
            throw new InvalidArgumentException('Platform ID must be a valid UUID.');
        }
        if ( !Utils::checkNotEmptyString($token) ) {
            throw new InvalidArgumentException('Token must be provided.');
        }
        $this->integrationId = $integrationId;
        $this->token = $token;
        $this->platformId = $platformId;
        $this->subscriptions = $subscriptions;
    }

    public function getIntegrationId(): string {
        return $this->integrationId;
    }

    public function getToken(): string {
        return $this->token;
    }

    public function getPlatformId(): string {
        return $this->platformId;
    }

    /**
     * Summary of getSubscriptions
     * @return Subscription[]
     */
    public function getSubscriptions(): array {
        return $this->subscriptions;
    }

    public function setSubscriptions(array $subscriptions): void {
        $this->subscriptions = $subscriptions;
    }

    public function hasSubscription(string $subscriptionName): bool {
        foreach ($this->subscriptions as $subscription) {
            if ($subscription->getName() === $subscriptionName) {
                return true;
            }
        }
        return false;
    }

    public function deleteSubscription(string $subscriptionName): Subscription|null {
        $index = ArrayUtils::findIndexOf($this->subscriptions, fn (Subscription $subscription) => $subscription->getName() === $subscriptionName);
        if ($index !== -1) {
            $deletedSubscription = $this->subscriptions[$index];
            array_splice($this->subscriptions, $index, 1);
            return $deletedSubscription;
        }
        return null;
    }

}
