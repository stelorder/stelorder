<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services\DTOs;

use InvalidArgumentException;
use Stel\Verifactu\Services\DTOs\Factories\SubscriptionFactory\SubscriptionType;

class SaveWebhookDTO {
    private $sync;
    private $external_id;
    /**
     * Summary of local_ids
     * @var int[]
     */
    private $local_ids;
    private $fields;
    private $name;
    private $props;

    private function isInvalidStringKey($key) {
        return !is_string($key);
    }

    public function __construct($sync, $external_id, $fields, $name, $props = [], $local_ids = []) {
        if ( ! empty($name) && preg_match('/[^a-zA-Z]/', $name) ) {
            throw new InvalidArgumentException( $name . ' must not be null and name only allows letters' );
        }
        if (!is_bool($sync)) {
            throw new InvalidArgumentException( $name . ' sync must be a boolean' );
        }
        if ( isset($external_id) && !preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/', $external_id) ) {
            throw new InvalidArgumentException( $name . ' external_id must be a valid UUID' );
        }
        if ( !isset($fields) || !is_array($fields) ) {
            $this->fields = [];
        }

        if (isset($fields) && is_array($fields)) {
            foreach ($fields as $key => $value) {
                if ( $this->isInvalidStringKey($key) ) {
                    error_log( 'Invalid key: ' . $key );
                    throw new InvalidArgumentException( $name . ' fields key must be a string and have only minuscule letters and _' );
                }
                if ( !is_bool($value) ) {
                    throw new InvalidArgumentException( $name . ' fields value must be a boolean' );
                }
            }
        }

        if ( !isset($props) ) {
            $props = [];
        }

        foreach ($props as $key => $value) {
            if ( $this->isInvalidStringKey($key) ) {
                error_log( 'Invalid prop key: ' . $key );
                throw new InvalidArgumentException( $name . ' props key must be a string and have only minuscule letters and _' );
            }
        }

        if (isset($local_ids)) {
            foreach ($local_ids as $local_id) {
            if (empty($local_id) || !is_int($local_id) || $local_id <= 0) {
                throw new InvalidArgumentException($name . ' local_id must be an integer greater than 0');
            }
        }
        }

        error_log('Setting props: ' . print_r($props, true));
        
        $this->sync = $sync;
        $this->external_id = $external_id;
        $this->fields = $fields;
        $this->name = $name;
        $this->props = $props;
        $this->local_ids = $local_ids;
    }

    public static function build(SubscriptionType $type): SaveWebhookDTO {
        return $type->provideSubscriptionFactoryStrategy()->build();
    }

    public function getSync() {
        return $this->sync;
    }

    public function getExternalId() {
        return $this->external_id;
    }

    public function getFields() {
        return $this->fields ?? [];
    }

    public function getName() {
        return $this->name;
    }

    public function getProps() {
        return $this->props ?? [];
    }

    public function getLocalIds() {
        return $this->local_ids;
    }


}