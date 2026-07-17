<?php

namespace Stel\Verifactu\Services\Mapper;

use Stel\Verifactu\Controllers\DTOs\SaveExternalProduct;

class ProductMapper {
    private const MAPPING = [
        'name' => 'name',
        'global_unique_id' => 'global_unique_id',
        'sku' => 'sku',
        'description' => 'description',
    ];
    private static ?ProductMapper $instance = null;
    private function __construct() {}
    public static function getInstance(): ProductMapper {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function mapWithoutStock(SaveExternalProduct $productDto, \WC_Product $product): \WC_Product {
        foreach (self::MAPPING as $dtoField => $productField) {
            if (isset($productDto->$dtoField)) {
                $setter = 'set_' . $productField;
                if (method_exists($product, $setter)) {
                    $product->$setter($productDto->$dtoField);
                }
            }
        }

        if (!empty($productDto->price)) {
            if ($this->isOnSale($product)) {
                $product->set_sale_price($productDto->price);
            } else {
                $product->set_regular_price($productDto->price);
            }
        }

        return $product;
    }

    private function isOnSale(\WC_Product $product): bool {
        if (empty($product->get_sale_price())) {
            return false;
        }
        $now = time();
        $from = $product->get_date_on_sale_from() ? $product->get_date_on_sale_from()->getTimestamp() : null;
        $to = $product->get_date_on_sale_to() ? $product->get_date_on_sale_to()->getTimestamp() : null;
        // Oferta indefinida, sin fecha de inicio ni fin
        if (!$from && !$to) {
            return true;
        }
        return ( !$from || $from <= $now ) && ( !$to || $to >= $now );
    }


}