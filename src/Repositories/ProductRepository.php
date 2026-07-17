<?php

namespace Stel\Verifactu\Repositories;

use WC_Product;

class ProductRepository extends WCDataRepository {


    protected function getResourceClass(): string {
        return 'WC_Product';
    }

    public function getById( int $id ): WC_Product|null {
        $product = wc_get_product( $id );
        return $product && $product->get_id() ? $product : null;
    }

    public function save( WC_Product $product ): void {
        $this->setSuppressWebhooks(true);
        $product->save();
        $this->setSuppressWebhooks(false);
    }

    public function exists( int $id ): bool {
        $result = wc_get_product( $id );
        return $result && $result->get_id();
    }

	/**
	 * @param array{
	 *     name?: string,
	 *     sku?: string,
	 *     global_unique_id?: string,
	 *
	 * } $queryParams Query parameters to filter products. Supported keys:
	 *     <ul>
	 *         <li><b>name</b>: Filter products by name.</li>
	 *          <li><b>sku</b>: Filter products by SKU.</li>
	 *         <li><b>global_unique_id</b>: Filter products by global unique ID.</li>
	 *     </ul>
	 * @return WC_Product[] An array of products matching the query parameters.
	 * */
	public function getProductsBy(array $queryParams): array {
		$allowedKeys = ['name', 'sku', 'global_unique_id'];
		$queryParams = array_filter(
			$queryParams,
			fn($key) => in_array($key, $allowedKeys) && isset($queryParams[$key]),
			ARRAY_FILTER_USE_KEY
		);

		$queryResult = [];

		foreach ($queryParams as $key => $value) {
			if ($key === 'global_unique_id') {
				$result = $this->getByGlobalUniqueId($value);
			} elseif ($key === 'name') {
				$result = $this->getProductsByNameLike($value);
			} else {
				$args = [
					'limit'  => -1,
					'return' => 'objects',
					'status' => 'publish',
					$key     => $value,
					'type' => ['simple', 'variation']
				];
				$result = wc_get_products($args);
			}

			if (is_array($result)) {
				foreach ($result as $product) {
					if ($product instanceof WC_Product && $product->get_id()) {
						$queryResult[$product->get_id()] = $product;
					}
				}
			}
		}

		return array_values($queryResult);
	}

	/**
	 * Busca productos cuyo título contenga $name (%name%).
	 *
	 * <b>WARNING</b> Depende de `wp_posts.post_title` mediante el hook `posts_where`.
	 * Si WooCommerce migra productos a Custom Product Tables (como hizo con
	 * pedidos en HPOS), este metodo deberá revisarse para adaptarse a la
	 * nueva estructura de almacenamiento.
	 *
	 * @param string $name
	 * @return WC_Product[]
	 */
	private function getProductsByNameLike(string $name): array {
		global $wpdb;

		$whereClosure = function (string $where) use ($name, $wpdb): string {
			$where .= $wpdb->prepare(
				" AND {$wpdb->posts}.post_title LIKE %s",
				'%' . $wpdb->esc_like($name) . '%'
			);
			return $where;
		};

		add_filter('posts_where', $whereClosure);

		try {
			$result = wc_get_products([
				'limit'  => -1,
				'return' => 'objects',
				'status' => 'publish',
				'type'   => ['simple', 'variation'],
			]);
		} finally {
			// ✅ Se ejecuta siempre, haya excepción o no
			remove_filter('posts_where', $whereClosure);
		}

		return $result;
	}

	/**
	 * @param string|null $globalUniqueId
	 * @return WC_Product[]
	 */
	private function getByGlobalUniqueId(?string $globalUniqueId): array {
		if (!$globalUniqueId) {
			return [];
		}

		$productId = wc_get_product_id_by_global_unique_id( $globalUniqueId );
		if (!$productId) {
			return [];
		}
		$result = wc_get_product( $productId );
		return $result instanceof WC_Product ? [$result] : [];
	}

}