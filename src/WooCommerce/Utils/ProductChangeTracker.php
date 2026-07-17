<?php

namespace Stel\Verifactu\WooCommerce\Utils;

use Exception;
use Automattic\WooCommerce\Enums\ProductType;
use Stel\Verifactu\Logs\Logger;

class ProductChangeTracker
{
    public const PREFIX = 'stel_verifactu_product_last_change_';
    public const CHANGE_ID_META_KEY_TEMPLATE = 'stel_verifactu_product_last_change_<id>_from_<date>';
    private static array $variableProductIdMap = [];
    private static array $bufferId = [];

    public static function addToBufferId(int $productId): void
    {
        if (!self::isInBufferId($productId)) {
            self::$bufferId[] = $productId;
        }
    }

    public static function pullFromBufferId(): array
    {
        $bufferedIds = self::$bufferId;
        self::$bufferId = [];
        return $bufferedIds;
    }

    private static function isInBufferId(int $productId): bool
    {
        return in_array($productId, self::$bufferId);
    }

    public static function trackProductChanges(\WC_Product &$product): void
    {
        $enabled = true;
	    $enabled = apply_filters('stel_verifactu_should_track_product_changes', $enabled, $product);

        if (!$enabled) {
            return;
        }

        if ($product->is_type(ProductType::VARIABLE)) {

            if (!isset(self::$variableProductIdMap[$product->get_id()])) {
                self::$variableProductIdMap[$product->get_id()] = [];
            }
            if (!empty($product->get_changes())) {
                /** @var \WC_Product_Variable $variableProduct */
                $variableProduct = $product;
                $variationIds = $variableProduct->get_children();
                self::$variableProductIdMap[$product->get_id()] = array_unique(
                    array_merge(self::$variableProductIdMap[$product->get_id()], $variationIds)
                );
            }
            self::saveProductTrackedInfo(
                $product->get_id(),
                $product->get_date_modified() ?
                    gmdate('Y-m-d H:i:s', $product->get_date_modified()->getTimestamp()) :
                    gmdate('Y-m-d H:i:s')
            );
        } elseif ($product->is_type(ProductType::VARIATION)) {
            $parentId = $product->get_parent_id();
            if (!isset(self::$variableProductIdMap[$parentId])) {
                self::$variableProductIdMap[$parentId] = [];
            }
            self::$variableProductIdMap[$parentId][] = $product->get_id();
        }
    }

    private static function saveProductTrackedInfo(int $productId, string $date): void
    {
        error_log("Tracking changes for product $productId with date $date");
        $nametag = self::getProductChangeTrackerNametag($productId, $date);
        $currentTrackedVariations = self::$variableProductIdMap[$productId] ?? [];
        $persistedTrackedVariations = get_option($nametag, []);
        $mergedTrackedVariations = array_unique(array_merge($currentTrackedVariations, $persistedTrackedVariations));
        
        update_option($nametag, $mergedTrackedVariations);
    }

    public static function getProductChangeTrackerNametag(int $productId, string $date): string
    {
        return str_replace(['<id>', '<date>'], [$productId, $date], self::CHANGE_ID_META_KEY_TEMPLATE);
    }

    public static function pullTrackedVariationIdsForProduct(int $productId,): array
    {
        error_log("Pulling tracked variation IDs for product $productId");
        return self::atomicPullProductTrackedInfo($productId);
    }

    public static function cleanProductTrackedInfo(): void {
        global $wpdb;
        try {
            $deleteResult = $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                    self::PREFIX . '%'
                )
            );
            if ($deleteResult === false) {
                throw new Exception('Error deleting tracked product info from database: ' . $wpdb->last_error);
            }
        } catch (Exception $e) {
            Logger::addLog( "Error trying to clean tracked product info: " . $e->getMessage() );
        }
    }
    
    private static function atomicPullProductTrackedInfo(int $productId): array
    {
        global $wpdb;
        $finalResult = [];

        try {
            $wpdb->query('START TRANSACTION');
            // Using PREFIX
            $result = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
                    self::PREFIX . $productId . '%'
                ),
                ARRAY_A
            );
            if ($result === null) {
                throw new Exception('Error fetching tracked product info from database: ' . $wpdb->last_error);
            }

            error_log("Fetched tracked product info for product $productId: " . print_r(json_encode($result), true));

            $deleteResult = $wpdb->query(
                $wpdb->prepare(
                    "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                    self::PREFIX . $productId . '%'
                )
            );

            if ($deleteResult === false) {
                throw new Exception('Error deleting tracked product info from database: ' . $wpdb->last_error);
            }

            $finalResult = array_reduce($result, function ($acc, $item) {
                $optionValue = maybe_unserialize($item['option_value'] ?? '');
                if (is_array($optionValue)) {
                    return array_merge($acc, $optionValue);
                }
                return $acc;
            }, []);
            $finalResult = array_values( array_unique($finalResult) );
            error_log("Pulled tracked variation IDs for product $productId: " . print_r(json_encode($finalResult), true));
            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            Logger::addLog( "Error starting transaction to pull tracked product info: " . $e->getMessage() );
        }
        return $finalResult;
    }

}