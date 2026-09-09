<?php

namespace Stel\Verifactu\Services;

use Exception;
use Stel\Verifactu\Domain\EventActionType;
use Stel\Verifactu\Domain\SyncEntityType;
use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Repositories\ProductRepository;
use Stel\Verifactu\Repositories\SyncRepository;
use WC_Product_Variation;

class SyncService {
    private const PRODUCT_FIELDS = ['id', 'name', 'sku', 'images', 'description', 'price', 'global_unique_id', 'stock_quantity' ];
    private static ?SyncService $instance = null;
    private ProductService $productService;
    private SyncRepository $syncRepository;
    private StelEventService $stelEventService;


    private function __construct() {
        $this->productService = ProductService::getInstance();
        $this->syncRepository = SyncRepository::getInstance();
        $this->stelEventService = StelEventService::getInstance();
    }

    public static function getInstance(): SyncService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * @param int[] $productIds
     * @return string
     * @throws EntityNotFound If any product ID does not exists
     * @throws Exception If a product sync event is already in progress
     */
    public function syncProducts(array $productIds) {
        $syncEventId =  $this->syncRepository->getSyncEntity(SyncEntityType::PRODUCT_TYPE);
        if ($syncEventId !== null ) {
            throw new Exception("A sync event is already in progress. Please wait for it to complete before starting a new one.");
        }
        $products = [
            "products" => $this->getProductsData($productIds)
        ];
        $syncEventId = $this->stelEventService->sendPublishEvent(SyncEntityType::PRODUCT_TYPE->value, EventActionType::UPDATE, $products);
        $this->syncRepository->saveSyncEntity(SyncEntityType::PRODUCT_TYPE, $syncEventId);
        return $syncEventId;
    }

    /**
     * @throws Exception
     */
    public function fetchPublishedProducts(): array
    {
        $syncEventId =  $this->syncRepository->getSyncEntity(SyncEntityType::PRODUCT_TYPE);
        if (empty($syncEventId)) {
            throw new Exception("There is no sync event in progress. Please start a sync event before fetching published products.");
        }
        return $this->stelEventService->fetchEventJobs($syncEventId);
    }

    /**
     * @throws EntityNotFound
     */
    private function getProductsData(array $productIds): array {
        $productsData = [];
        foreach ($productIds as $productId) {
            $product = $this->productService->getProductById($productId);
            $productData = [];
            foreach (self::PRODUCT_FIELDS as $field) {
                if (method_exists($product, "get_$field")) {
                    if ($field === 'id' && $product instanceof WC_Product_Variation) {
                        $productData[$field] = "{$product->get_parent_id()}-{$product->get_id()}";
                    } else {
                        $productData[$field] = $product->{"get_$field"}();
                    }
                } else if($field === "images") {
                    $images = [];
                    if ($product instanceof WC_Product_Variation) {
                        $variation = $product;
                        $image = $variation->get_image_id();
                        $src = wp_get_attachment_url($image);
                        $images[] = ['src' => (empty($src) ? '' : $src)];
                    } else {
                        $imageIds = $product->get_gallery_image_ids();

                        foreach ($imageIds as $imageId) {
                            $src = wp_get_attachment_url($imageId);
                            $images[] = ['src' => (empty($src) ? '' : $src)];
                        }
                    }
                    $productData[$field] = $images;
                }

            }
            $externalId = $product->get_meta(ProductRepository::SYNC_META_FIELD);
            $productData['entity_synchronized_id'] = !empty($externalId) ? $externalId : null;
            $productsData[] = $productData;
        }
        return $productsData;
    }

    public function deletePendingEventProducts():?string {
        $syncEventId =  $this->syncRepository->getSyncEntity(SyncEntityType::PRODUCT_TYPE);
        $this->syncRepository->deleteSyncEntity(SyncEntityType::PRODUCT_TYPE);
        return $syncEventId;
    }

    public function getPendingEventProducts(): ?string {
        return $this->syncRepository->getSyncEntity(SyncEntityType::PRODUCT_TYPE);
    }


}