<?php

namespace Stel\Verifactu\WooCommerce\Transformer;

use Automattic\WooCommerce\Enums\ProductType;
use Stel\Verifactu\Services\ProductService;
use Stel\Verifactu\WooCommerce\Utils\ProductChangeTracker;
use WC_Product_Variation;

class ProductTransformer {
    private static ?ProductTransformer $instance = null;
    private ProductService $productService;
    private const PRODUCT_FIELDS = ['id', 'name', 'type', 'images', 'sku', 'description', 'price', 'global_unique_id' ];

    private function variant_images(WC_Product_Variation $variation): array {
        $image = $variation->get_image_id();
        $src = wp_get_attachment_url($image);
        return [
            ['src' => (empty($src) ? '' : $src)]
        ];
    }

    private function variant_id(WC_Product_Variation $variation): string {
        return "{$variation->get_parent_id()}-{$variation->get_id()}";
    }

    private function variant_sku(WC_Product_Variation $variation): string {
        return $variation->get_sku('edit') ?: '';
    }

    public static function getInstance(): ProductTransformer {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->productService = ProductService::getInstance();
    }

        public function transform(array &$productData): void {
            /* @var \WC_Product[] $products */
            $products = ['products' => []];

            if ($this->isVariable($productData)) {
                $products['products'] = $this->transformVariations($productData);
            } else {
                $products['products'][] = $this->transformProduct($productData);
            }

            $productData = $products;
        }

        private function transformProduct(array $productData) : array {
         $product = [];
            foreach (self::PRODUCT_FIELDS as $field) {
                if (isset($productData[$field])) {
                    $product[$field] = $productData[$field];
                }
            }
         return $product;
        }

        private function isVariable(array $productData): bool {
            return isset($productData['type']) && $productData['type'] === ProductType::VARIABLE;
        }

        private function transformVariations(array $productData): array {
            if (!isset($productData['variations']) || !is_array($productData['variations'])) {
                return [];
            }
            $productVariationIds = ProductChangeTracker::pullTrackedVariationIdsForProduct(
                $productData['id']
            );
            $result = array_filter(
                array_map(
                    function (int $variation) {
                        /* @var \WC_Product_Variation $productVariation */
                        $productVariation = $this->productService->getProductById((string)$variation, true);
                        if (empty($productVariation)) {
                            return null;
                        }
                        $variationData = [];
                        $wcId = $productVariation->get_id();
                        foreach (self::PRODUCT_FIELDS as $field) {
                            $propMethod = 'get_' . $field;
                            if (method_exists($productVariation, $propMethod)) {
                                $variationData[$field] = $productVariation->$propMethod();
                            }
                            if (method_exists(self::getInstance(), 'variant_' . $field)) {
                                $variationData[$field] = self::getInstance()->{'variant_' . $field}($productVariation);
                            }
                        }
                        $variationData['wcId'] = $wcId;
                        return $variationData;
                    },
                    $productData['variations']
                ),
                function ($variation) use ($productVariationIds) {
                    return $variation !== null && in_array($variation['wcId'], $productVariationIds);
                }
            );

            return array_values($result);
        }
}