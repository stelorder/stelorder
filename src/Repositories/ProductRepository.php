<?php

namespace Stel\Verifactu\Repositories;

use Automattic\WooCommerce\Enums\ProductType;
use Stel\Verifactu\App;
use WC_Product;

class ProductRepository extends WCDataRepository {

    public const PARENT_IN = App::NAME . '_parent_in';
    public const SYNC_META_FIELD = '_' . App::NAME . '_external_id';
    public const HAS_SYNC_META_FIELD = App::NAME . '_has_external_id';

    protected function __construct() {
        parent::__construct();

        add_filter( 'woocommerce_product_data_store_cpt_get_products_query', function( $wp_query_args, $query_vars ) {
            if ( isset( $query_vars[self::HAS_SYNC_META_FIELD] ) ) {
                if ( $query_vars[self::HAS_SYNC_META_FIELD] ) {
                    $wp_query_args['meta_query'][] = [
                        'key'     => self::SYNC_META_FIELD,
                        'value'   => '',
                        'compare' => '!=',
                    ];
                } else {
                    $wp_query_args['meta_query'][] = [
                        'relation' => 'OR',
                        [
                            'key'     => self::SYNC_META_FIELD,
                            'compare' => 'NOT EXISTS',
                        ],
                        [
                            'key'     => self::SYNC_META_FIELD,
                            'value'   => '',
                            'compare' => '=',
                        ],
                    ];
                }
            }
            return $wp_query_args;
        }, 10, 2 );

        add_filter('woocommerce_product_data_store_cpt_get_products_query', function($query, $query_vars) {
            if (!empty($query_vars[self::PARENT_IN]) && is_array($query_vars[self::PARENT_IN])) {
                $query['post_parent__in'] = array_map('absint', $query_vars[self::PARENT_IN]);
            } elseif (isset($query_vars[self::PARENT_IN])) {
                // parent_in se pasó pero está vacío: forzar que no devuelva nada
                $query['post__in'] = [0];
            }
            return $query;
        }, 10, 2);
    }


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

    /** Get all available product categories
     * @return array{
     *     "name": string,
     *     "count": int,
     *     "products": int[],
     *     "children": ?array
     * }[]|\WP_Error
     * */
    public function getAvailableProductCategories(): array|\WP_Error {

        $categories = get_terms( array(
            'taxonomy'   => 'product_cat',
            'orderby'    => 'name',
            'order'      => 'ASC',
            'hide_empty' => false, // true para excluir categorías sin productos
        ) );
        if (empty($categories) || is_wp_error($categories)) {
            return $categories;
        }
        $categories = array_reduce( array_map(
            function (\WP_Term $catTerm) {
                $types =  array_filter( array_merge( array_keys( wc_get_product_types() ) ),
                    function($type) {
                        return $type !== ProductType::VARIABLE;
                    }
                );
                $catQuery = [
                    [
                        'taxonomy'         => 'product_cat',
                        'field'            => 'slug',
                        'terms'            => [$catTerm->slug],
                        'include_children' => false,
                    ],
                ];

                $productsIds = wc_get_products( [
                    'limit'      => -1,
                    'type' => $types,
                    'return'     => 'ids',
                    'status'     => 'publish',
                    'tax_query' => $catQuery,
                    self::HAS_SYNC_META_FIELD => false,
                ] );

                $variables = wc_get_products([
                    'limit'      => -1,
                    'return'     => 'ids',
                    'status'     => 'publish',
                    'type' => [ ProductType::VARIABLE ],
                    'tax_query' => $catQuery,
                ]);

                $variantsWithExternalIds = wc_get_products([
                    'limit'      => -1,
                    'return'     => 'ids',
                    'status'     => 'publish',
                    self::PARENT_IN     => $variables,
                    'type' => [ ProductType::VARIATION ],
                    self::HAS_SYNC_META_FIELD => false,
                ]);
                $result = array_unique(
                    array_merge(
                        $productsIds,
                        $variantsWithExternalIds
                    )
                );

                return [
                    'id' => $catTerm->term_id,
                    'label' => $catTerm->name,
                    'value' => $catTerm->slug,
                    'parent' => $catTerm->parent,
                    'count' => count( $result ),
                    'productIds' => $result
                ];
            },
            array_filter(
                $categories,
                function (\WP_Term $catTerm) {
                    return $catTerm->count > 0;
                }
            )
        ), function($acc, $cat) {
            $acc[$cat['id']] = $cat;
            return $acc;
        } , [] );
        return $this->groupChildrenCategories($categories);
    }

    /**
     * Agrupa las categorías hijas dentro de sus padres.
     * @return array{
     *      "name": string,
     *      "count": int,
     *      "products": int[],
     *      "children": ?array
     *  }[]
     */
    private function groupChildrenCategories(array $categories): array {

        foreach ($categories as $id => &$cat) {
            if ($cat['parent'] !== 0 && isset($categories[$cat['parent']])) {
                if (!isset($categories[$cat['parent']]['children'])) {
                    $categories[$cat['parent']]['children'] = [];
                }
                $categories[$cat['parent']]['children'][] = &$cat;
            }
        }
        unset($cat);

        return array_values(array_filter(
            $categories,
            fn($resultCat) => $resultCat['parent'] === 0
        ));
    }

}