<?php

namespace Stel\Verifactu\Domain;
use InvalidArgumentException;

class Subscription {
    /**
     * List of IDs persisted locally
     * @var int[]
     */
    private array $localIds;
    /**
     * External ID from the remote service
     * @var string
     */
    private string $externalId;
    /**
     * Resource name represented by Subscription
     * @var string
     */
    private string $name;
    /**
     * Subscription properties
     * @var array<string, bool>
     */
    private array $props;

    /**
     * Mapping fields from the external service. It it a lazy attribute that must be obtained from the service operation.
     * @var array<string, bool>
     * @deprecated
     */
    private array | null $fields;

    /**
     * @template T of object
     * @var class-string<T>|null Type of the local subscription, whose local IDs refer to
     */
    private $localType;

    public function __construct(array $localIds, string $externalId, string $name, array $props, ?array $fields = null) {
        if ( empty($localIds) ) {
            throw new InvalidArgumentException('Local IDs must be provided and not empty.');
        }

        foreach ($localIds as $localId) {
            if ( !Utils::checkIsPositiveInt($localId) ) {
                throw new InvalidArgumentException('Each Local ID must be a positive integer.');
            }
        }

        if ( !Utils::checkIsValidUUID($externalId) ) {
            throw new InvalidArgumentException('External ID must be a valid UUID.');
        }
        if ( !Utils::checkNotEmptyString($name) ) {
            throw new InvalidArgumentException('Name must be provided.');
        }
        $this->localIds = $localIds;
        $this->externalId = $externalId;
        $this->name = $name;
        $this->props = $props;
        $this->fields = $fields;
    }

    /**
     * Returns the local subscription class type, which can be used to determine how to handle the local IDs.
     * @template T of object
     * @return class-string<T>|null The class name of the local subscription type, or null if not set
     */
    public function getLocalType(): ?string
    {
        return $this->localType;
    }

    /**
     * Sets the local subscription class type, which can be used to determine how to handle the local IDs.
     * @template T of object
     * @param class-string<T> $localType The class name of the local subscription type
     * @return void
     */
    public function setLocalType(string $localType): void {
        $this->localType = $localType;
    }

    public function getLocalIds(): array {
        return $this->localIds;
    }

    public function getExternalId(): string {
        return $this->externalId;
    }

    public function getName(): string {
        return $this->name;
    }

    public function getProps(): array {
        return $this->props;
    }

    public function setProps(array $props): void {
        foreach ($props as $key => $value) {
            if ( !is_string($key) || preg_match('/[^a-z_.0-9]/', $key) ) {
                throw new InvalidArgumentException( 'Props key must be a string and have only minuscule letters and _' );
            }
        }
        $this->props = $props;
    }

    /**
     * If the subscription has not fetched by the service, this will return **null**
     * @deprecated
     * @return array<string, bool> | null fields using for mapping in the external service
     */
    public function getFields(): array | null {
        return $this->fields;
    }

    /**
     * This method sets the fields for the subscription.
     * @deprecated
     * @param array<string, bool> $fields fields to be used for mapping in the external service
     * @throws \InvalidArgumentException if the fields are not a pair of strings and booleans
     * @return void
     */
    public function setFields(array $fields): void {
        foreach ($fields as $key => $value) {
            if ( !is_string($key) || preg_match('/[^a-z_.0-9]/', $key) ) {
                throw new InvalidArgumentException( 'Fields key must be a string and have only minuscule letters and _' );
            }
            if ( !is_bool($value) ) {
                throw new InvalidArgumentException( 'Fields value must be a boolean' );
            }
        }
        $this->fields = $fields;
    }

}
