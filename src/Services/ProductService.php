<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Exception;
use http\Exception\InvalidArgumentException;
use Stel\Verifactu\Controllers\DTOs\ExistingProductById;
use Stel\Verifactu\Controllers\DTOs\QueryProductsDto;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProduct;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProductImages;
use Stel\Verifactu\Controllers\DTOs\SaveExternalProductStock;
use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Repositories\ProductRepository;
use Stel\Verifactu\Repositories\ProductVariationRepository;
use Stel\Verifactu\Repositories\WCDataRepository;
use Stel\Verifactu\Services\Mapper\ProductMapper;

class ProductService {
    private static ?ProductService $instance = null; // Instancia única de la clase
    private ProductRepository $productRepository;
    private ProductVariationRepository $productVariationRepository;
	private ImageService $imageService;

    private ProductMapper $mapper;
    // Constructor privado para evitar la instanciación directa
    private function __construct() {
        $this->productRepository = ProductRepository::getInstance();
        $this->productVariationRepository = ProductVariationRepository::getInstance();
        $this->mapper = ProductMapper::getInstance();
	    $this->imageService = ImageService::getInstance();
    }

    // Método para obtener la instancia única
    public static function getInstance(): ProductService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

	/**
	 * @param QueryProductsDto $query
	 * @return \WC_Product[] An array of product matching the query parameters.
	 * */
	public function getProductsBy(QueryProductsDto $query): array {
		$hasNotEmptyValue = false;
		$queryParams = get_object_Vars($query);
		for ($i = 0; $i < count($queryParams) && !$hasNotEmptyValue; $i++) {
			$hasNotEmptyValue = isset($queryParams[array_keys($queryParams)[$i]]) && !empty($queryParams[array_keys($queryParams)[$i]]);
		}
		if (!$hasNotEmptyValue) {
			throw new InvalidArgumentException("At least one query parameter must be provided and not empty");
		}
		return $this->productRepository->getProductsBy($queryParams);
	}


    /**
     * @throws EntityNotFound
     */
    public function getProductById(string $productId, bool $variation = false) {
        // $repo = $variation ? $this->productVariationRepository : $this->productRepository;
        $product =  $this->productRepository->getById( $productId );
        if (!$product) {
            throw new EntityNotFound("Product with ID $productId not found");
        }
        return $product;
    }


	/** Create a new product if the ID is not provided, or update the existing one if the ID is provided. If the product is a variation,
	 * the product ID will be formed by the parent ID and the variation ID, separated by a dash (e.g. "123-456"). The method, will not
	 * update the null fields, so if you want to set a field to null, you need to set it to an empty string or 0, depending on the field type.
	 * @throws EntityNotFound If the product to update is not found
	 */
	public function saveProduct(SaveExternalProduct $productDto): \WC_Product {
        if ($productDto->id !== null) {
			$product = $this->updateProduct($productDto);
        } else {
	        $product = $this->createProduct($productDto);
        }

		if (!empty($productDto->images)) {
            $this->saveProductImages($product, $productDto->images);
		}

		return $product;
    }

    private function saveProductImages(\WC_Product $product, array $imageUrls): void {

        $imageIds = $this->imageService->importImageFromUrls($imageUrls);
        if (!empty($imageIds)) {
            $product->set_image_id($imageIds[0]);
            if (count($imageIds) > 1) {
                $product->set_gallery_image_ids(array_slice($imageIds, 1));
            } else {
                $product->set_gallery_image_ids([]);
            }
            $this->productRepository->save($product);
        }
    }

	private function createProduct(SaveExternalProduct $productDto): \WC_Product {
		$product = new \WC_Product_Simple();
		$product = $this->mapper->mapWithoutStock($productDto, $product);
		if (isset($productDto->price)) {
			$product->set_regular_price($productDto->price);
		}
		if ($productDto->stock_quantity !== null) {
			$product->set_manage_stock(true);
			$product->set_stock_quantity($productDto->stock_quantity);
		}
		$this->productRepository->save($product);
		return $product;
	}

    /**
     * @throws EntityNotFound
     */
    public function updateProductStock(SaveExternalProductStock $stockDto): \WC_Product {
        $product = $this->getProductById($stockDto->variation_id ?: $stockDto->parent_id);
        if ($stockDto->stock_quantity === null) {
            return $product;
        }
        $this->updateStock($stockDto->stock_quantity, $product);
        $this->productRepository->save($product);
        return $product;
    }

    /**
     * @throws EntityNotFound
     */
    public function updateProductImages(SaveExternalProductImages $imagesDto): \WC_Product {
        $product = $this->getProductById($imagesDto->variation_id ?: $imagesDto->parent_id);
        if (empty($imagesDto->images)) {
            return $product;
        }
        $this->saveProductImages($product, $imagesDto->images);
        return $product;
    }

    public function existsProduct(ExistingProductById $productId): bool {
        return $this->productRepository->exists($productId->variation_id?:$productId->parent_id);
    }



    /**
     * @throws EntityNotFound
     */
    public function updateProduct(SaveExternalProduct $productDto ): ?\WC_Product {
        $oldProduct = $this->getProductById($productDto->variation_id ?: $productDto->parent_id);
        $updatedProduct = $this->mapper->mapWithoutStock($productDto, $oldProduct);
        if ($productDto->stock_quantity !== null) {
            $this->updateStock($productDto->stock_quantity, $updatedProduct);
        }
        $this->productRepository->save($updatedProduct);
        return $updatedProduct;
    }

    private function updateStock(float $quantity, \WC_Product $product): void {

		if ($product instanceof \WC_Product_Variation) {
            if ($product->get_manage_stock() === "parent") {
                $product = $this->productRepository->getById($product->get_parent_id());
				$product->set_stock_quantity($quantity);
				$this->productRepository->save($product);
				return;
            }
        }

	    $product->set_manage_stock(true);
	    $product->set_stock_quantity($quantity);
    }

    private function getProductoFromRepo(string $productId, WCDataRepository $repo) {
        $product = $repo->findById($productId);
        if (!$product || !$product->get_id()) {
            throw new Exception("Product with ID $productId not found");
        }
        return $product;
    }
}