<?php

namespace Stel\Verifactu\WooCommerce\Transformer;

class Transformers {

    public const ENTITY_ORDER = "order";
    public const ENTITY_PRODUCT = "product";
    private static ?Transformers $instance = null;
    private readonly array $TRANSFORMERS;

    public static function getInstance(): Transformers {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->TRANSFORMERS = [
           self::ENTITY_ORDER => OrderTransformer::getInstance(),
           self::ENTITY_PRODUCT => ProductTransformer::getInstance()
        ];
    }

    public function transform( string $entity, &$data): void {
        if (isset($this->TRANSFORMERS[$entity])) {
            $transformer = $this->TRANSFORMERS[$entity];
            $transformer->transform($data);
        } else {
            error_log("No transformer found for entity: $entity");
        }
    }


}
