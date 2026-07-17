<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Controllers\DTOs;

use InvalidArgumentException;

class SubscriptionDTO {
    private $external_id;
    private $fields;
    private $name;
    private $props;
    private $sync;

    private function isInvalidStringKey($key) {
        return !is_string($key);
    }

    public function __construct($external_id, $fields, $name, $props = [], $sync = true) {
        if ( ! empty($name) && preg_match('/[^a-zA-Z]/', $name) ) {
            throw new InvalidArgumentException( $name . ' must not be null and name only allows letters' );
        }
        if ( isset($external_id) && !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $external_id) ) {
            throw new InvalidArgumentException( $name . ' external_id must be a valid UUID' );
        }
        if ( !isset($fields) || !is_array($fields) ) {
            $this->fields = [];
        }
        foreach ($fields as $key => $value) {
            if ( $this->isInvalidStringKey($key) ) {
                error_log( 'Invalid key: ' . $key );
                throw new InvalidArgumentException( $name . ' fields key must be a string and have only minuscule letters and _' );
            }
            if ( !is_bool($value) ) {
                throw new InvalidArgumentException( $name . ' fields value must be a boolean' );
            }
        }

        foreach ($props as $key => $value) {
            if ( $this->isInvalidStringKey($key) ) {
                error_log( 'Invalid prop key: ' . $key );
                throw new InvalidArgumentException( $name . ' props key must be a string and have only minuscule letters and _' );
            }
        }

        error_log('Setting props: ' . print_r($props, true));
        
        $this->external_id = $external_id;
        $this->fields = $fields;
        $this->name = $name;
        $this->props = $props;
        $this->sync = $sync;
    }

    public function getExternalId() {
        return $this->external_id;
    }

    public function getFields() {
        return $this->fields;
    }

    public function getName() {
        return $this->name;
    }

    public function getProps() {
        return $this->props;
    }

    public function getSync() {
        return $this->props;
    }

    public function __serialize(): array {
        $data = [
            'sync' => $this->sync,
            'fields' => $this->fields,
            'name' => $this->name,
            'props' => $this->props,
        ];

        $externalId = $this->external_id;
        if (isset($externalId)) {
            $data['id'] = $externalId;
        }

        return $data;
    }
}