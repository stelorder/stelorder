<?php

namespace Stel\Verifactu\WooCommerce\Transformer;

use Exception;
use Stel\Verifactu\Services\CustomerService;
use Stel\Verifactu\Services\ProductService;
use Stel\Verifactu\Services\TaxService;
use WC_Order;
use WC_Order_Item;
use WC_Order_Item_Product;
use WC_Order_Item_Shipping;
use WC_Order_Refund;
use WC_Product;

class OrderTransformer {
    private static ?OrderTransformer $instance = null;
    private const NIF_KEY = "_wc_shipping/custom/nif";

    private CustomerService $customerService;
    private ProductService $productService;
    private TaxService $taxService;

    // Constructor privado para evitar la instanciación directa
    private function __construct() {
        $this->customerService = CustomerService::getInstance();
        $this->productService = ProductService::getInstance();
        $this->taxService = TaxService::getInstance();
    }

    public static function getInstance(): OrderTransformer {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function transform(&$order): void {
        $customerId = $order["customer_id"];
        
        if (filter_var($customerId, FILTER_VALIDATE_INT) === false || $customerId < 0) {
            return;
        }
        $orderEntity = new WC_Order($order["id"]);
        // Añadimos los atributos no privados asociados a las líneas del pedido
        $lines = $orderEntity->get_items() ?? [];
        $lineAttrs = $this->extractPublicOrderItemMeta($lines);
        foreach ($order['line_items'] as &$lineItem) {
            $lineId = $lineItem['id'];
            if (isset($lineAttrs[$lineId])) {
                $lineItem['line_attrs'] = $lineAttrs[$lineId];
            }
        }
        $refunds = array_map(function (WC_Order_Refund $refund) use ($order) {
            return [
                "id" => $refund->get_id(),
                "amount" => $refund->get_amount(),
                "reason" => $refund->get_reason(),
                "date_created_gmt" => $refund->get_date_created()->format('Y-m-d H:i:s'),
                "shipping_lines" => $this->mapShippingLines(array_values($refund->get_items("shipping") ?? []) ?? []),
                "fee_lines" => array_values(array_map( function ( WC_Order_Item $fee) {
                    return [
                        'id' => $fee->get_id(),
                        'name' => $fee->get_name(),
                        'total' => $fee->get_total(),
                        'total_tax' => $fee->get_total_tax(),
                        'taxes' => array_map(
                            function ($tax_id, $tax_total) {
                                return [
                                    "id" => $tax_id,
                                    "total" => $tax_total,
                                ];
                            },
                            array_keys($fee->get_taxes()['total']),
                            $fee->get_taxes()['total']
                        ),
                    ];
                }, $refund->get_fees() ?? [])),
                "line_items" => array_map( callback: function (WC_Order_Item_Product $line) use ($order) {
                    $refundedLine = $line->get_meta('_refunded_item_id', true);

                    if (!empty($refundedLine)) {
                        $filtered = array_filter($order['line_items'], function($item) use ($refundedLine) {
                            return isset($item['id']) && $item['id'] == $refundedLine;
                        });
                        $attrs = reset($filtered)['line_attrs'] ?? [];
                    }

                    $data = [
                        "id" => $line->get_id(),
                        "product_id" => $line->get_product_id(),
                        "variation_id" => $line->get_variation_id(),
                        "name" => $line->get_name(),
                        "quantity" => $line->get_quantity(),
                        "total" => $line->get_total(),
                        "total_tax" => $line->get_total_tax(),
                        "taxes" => array_map(
                            function ($tax_id, $tax_total) {
                                return [
                                    "id" => $tax_id,
                                    "total" => $tax_total,
                                ];
                            },
                            array_keys($line->get_taxes()['total']),
                            $line->get_taxes()['total']
                        ),

                    ];
                    if (!empty($attrs)) {
                        $data["line_attrs"] = $attrs;
                    }
                    return $data;
                }, array: array_values($refund->get_items()) ?? []),
            ];
        }, $orderEntity->get_refunds() ?? []);
        $order["refunds"] = $refunds;

        if ($customerId > 0) {
            // Transformar el cliente
            $this->customerTransform($order, $customerId);
        } else {
            $this->createCustomerFromShippingAndBilling($order);
        }
        // Añadimos la información de los productos a partir de las líneas del pedido
        $this->productTransform($order);
    }

    /**
     * @param WC_Order_Item[] $lines
     * @return array
     */
    private function extractPublicOrderItemMeta(array $lines): array {
        $result = [];
        foreach ($lines as $line) {
            $this->extractPublicMetadataLine($line, $result);
        }
        return $result;
    }

    public function extractPublicMetadataLine(WC_Order_Item $line, array &$result): void
    {
        $metaData = $line->get_formatted_meta_data('_', true) ?? [];
        foreach ($metaData as $meta) {
            $value = is_string($meta->value) ? $meta->value : json_encode($meta->value);
            if ($value !== false) {
                $result[$line->get_id()][] = [
                    "key" => $meta->key,
                    "value" => $value
                ];
            }
        }
    }

    private function createCustomerFromShippingAndBilling(&$order): void {
        $firstName = $order['billing']['first_name'] ?? $order['shipping']['first_name'] ?? '';
        $lastName = $order['billing']['last_name'] ?? $order['shipping']['last_name'] ?? '';
        $email = $order['billing']['email'] ?? $order['shipping']['email'] ?? '';
        $nif = $this->extractNifFromMetadata($order);
        $customer = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'nif' => !empty($nif) ? $nif : '--',
            'billing' => $order['billing'],
            'shipping' => $order['shipping']
        ];
        $order['customer'] = $customer;
    }

	private function extractNifFromMetadata($orderPayload) : string | null {
		if (isset($orderPayload['meta_data']) && is_array($orderPayload['meta_data'])) {
			foreach ($orderPayload['meta_data'] as $meta) {
				if (isset($meta['key']) && str_contains($meta['key'], 'nif') && !empty($meta['value'])) {
					return $meta['value'];
				}
			}
		}
		return null;
	}

    private function customerTransform(&$order, $customerId): void {
        try {
            $customer = $this->customerService->getCustomerById($customerId);
        } catch (Exception $e) {
            // Si no se encuentra el cliente, no hacemos nada
            return;
        }
        $nif = $this->extractNifFromMetadata($order);
        $customerData = [
            "id" => $customerId,
            "email" => $customer->get_email(),
            "first_name" => $customer->get_first_name(),
            "last_name" => $customer->get_last_name(),
            "billing" => [
                "first_name" => $customer->get_billing_first_name(),
                "last_name" => $customer->get_billing_last_name(),
                "address_1" => $customer->get_billing_address_1(),
                "address_2" => $customer->get_billing_address_2(),
                "company" => $customer->get_billing_company(),
                "city" => $customer->get_billing_city(),
                "state" => $customer->get_billing_state(),
                "postcode" => $customer->get_billing_postcode(),
                "country" => $customer->get_billing_country(),
                "phone" => $customer->get_billing_phone()
            ],
            "shipping" => [
                "first_name" => $customer->get_shipping_first_name(),
                "last_name" => $customer->get_shipping_last_name(),
                "company" => $customer->get_shipping_company(),
                "address_1" => $customer->get_shipping_address_1(),
                "address_2" => $customer->get_shipping_address_2(),
                "city" => $customer->get_shipping_city(),
                "state" => $customer->get_shipping_state(),
                "postcode" => $customer->get_shipping_postcode(),
                "country" => $customer->get_shipping_country(),
                "phone" => $customer->get_shipping_phone()
            ],
        ];
        if (!empty($nif)) {
            $customerData["nif"] = $nif;
        } else {
            $customerData["nif"] = "--";
        }
        $order["customer"] = $customerData;
    }

    private function productTransform(&$order): void {
        if (!isset($order['line_items'])) {
            return;
        }
        $products = [];
        $addedProductIds = [];
        $orderEntity = new WC_Order($order["id"]);
        $productLines = $orderEntity->get_items() ?? [];
        /**
         * @var array<string, double> $reducedStockByProductId
         */
        $reducedStockByProductId = [];

        /**
         * @var WC_Order_Item_Product $line
         */
        foreach ($productLines as $line) {
            $reducedStock = $line->get_meta('_reduced_stock', true);
            if (!empty($reducedStock) && is_numeric($reducedStock)) {
                $product = $line->get_product();
                if (!$product) {
                    continue;
                }
                $stockManagerId = $product->get_stock_managed_by_id();
                $reducedStockByProductId[$stockManagerId] = ($reducedStockByProductId[$stockManagerId] ?? 0) + $reducedStock;
            }
        }


        foreach ($order['line_items'] as &$lineItem) {
            $productId = $lineItem['product_id'];
            if (filter_var($productId, FILTER_VALIDATE_INT) === false || $productId <= 0) {
                return;
            }
            try {
                // Comprobamos si es una variación
                $isVariation = filter_var($lineItem['variation_id'] ?? 0, FILTER_VALIDATE_INT) !== false && $lineItem['variation_id'] > 0;

                $product = $this->productService->getProductById(
                    $isVariation ? $lineItem['variation_id'] : $productId
                    , $isVariation);
                    
                // Mapeamos los impuestos a un mapa de ids
                $lineItem['tax_rates_id'] = array_map(function($taxRate) {
                    return $taxRate['id'];
                }, $lineItem['taxes'] ?? []);


                /**
                 * @var WC_Product $product
                 */
                if ($product) {

                    $resultProductId = $productId . ($isVariation ? '-' . $lineItem['variation_id'] : '');

                    if (in_array($resultProductId, $addedProductIds)) {
                        continue;
                    }

                    $realStock = $product->get_stock_quantity();
                    if (isset($realStock)) {
                        $stockManagerId = $product->get_stock_managed_by_id();
                        $realStock = ($realStock) + ($reducedStockByProductId[$stockManagerId] ?? 0.0);
                    }

                    $productData = [
                        "id" => $resultProductId,
                        "name" => $product->get_name(),
                        "sku" => $product->get_sku(),
                        "price" => $product->get_price(),
                        "stock_quantity" => $realStock,
                        "description" => $product->get_description(),
                        "global_unique_id" => $product->get_global_unique_id()
                    ];
                    // Añadimos el producto a la lista de productos del pedido
                    $addedProductIds[] = $resultProductId;
                    $products[] = $productData;
                }
            } catch (Exception $e) {
                error_log("Error al obtener el producto con ID $productId: " . $e->getMessage());
                return;
            }
        }
        error_log("Products added: " . print_r($products, true));
        // Añadimos los productos al pedido
        $order["products"] = $products;
    }

    private function standardRateTransform(&$order) {
        try {
            $standardRates = $this->taxService->getStandardRates();
            if (empty($standardRates)) return;
            
            $order["standard_rates"] = $standardRates;
        } catch (Exception $e) {
            error_log("Error al obtener las tasas estándar: " . $e->getMessage());
            return;
        }
    }

    /**
     * Mapea las líneas de envío de un reembolso a un formato específico.
     *
     * @param WC_Order_Item_Shipping[]|null $shippingLines Las líneas de envío del reembolso.
     * @return array Un array con las líneas de envío mapeadas.
     */
    private function mapShippingLines(?array $shippingLines): array
    {
        if (empty($shippingLines)) {
            return [];
        }

        return array_map(function (WC_Order_Item_Shipping $shippingLine) {
            return [
                "id" => $shippingLine->get_id(),
                "method_title" => $shippingLine->get_method_title(),
                "total" => $shippingLine->get_total(),
                "total_tax" => $shippingLine->get_total_tax(),
                "taxes" => array_map(
                    function ($tax_id, $tax_total) {
                        return [
                            "id" => $tax_id,
                            "total" => $tax_total,
                        ];
                    },
                    array_keys($shippingLine->get_taxes()['total']),
                    $shippingLine->get_taxes()['total']
                ),
            ];
        }, $shippingLines);
    }
}
