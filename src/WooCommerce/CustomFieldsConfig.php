<?php

namespace Stel\Verifactu\WooCommerce;

use Automattic\WooCommerce\Blocks\Domain\Services\CheckoutFields;
use Automattic\WooCommerce\Admin\PageController;
use WP_Error;

class CustomFieldsConfig
{

    private static CustomFieldsConfig $instance;
    private CheckoutFields $checkoutFields;
    private function __construct()
    {
        $this->checkoutFields = wc_get_container()->get(CheckoutFields::class);
        error_log('Loading Custom fields config');
        $this->loadCustomFields();
    }

    public static function getInstance(): CustomFieldsConfig
    {
        if (!isset(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function loadCustomFields()
    {
        /** DOCS: https://developer.woocommerce.com/docs/cart-and-checkout-additional-checkout-fields/
         * Añade el campo NIF a las direcciones de envío y facturación
         * (funciona en Checkout Blocks y en el checkout clásico).

        error_log("Custom nif: " . ($this->checkoutFields->is_field('custom/nif') ? 'is present' : 'is not yet present'));
        if (!$this->checkoutFields->is_field('custom/nif')) {
            woocommerce_register_additional_checkout_field([
                'id' => 'custom/nif',           // namespace/slug
                'label' => 'NIF',
                'location' => 'address',              // contact | address | order
                'required' => true,
                'attributes' => [
                    'autocomplete' => 'tax-id',       // hint para navegadores
                    'pattern' => '[0-9A-Z]{8,10}' // ejemplo simple, ajusta a tu validador
                ],

            ]);
        }

        // Validación
        add_action(
            'woocommerce_validate_additional_field',
            function (WP_Error $errors, $field_key, $field_value) {
                if ('custom/nif' === $field_key) {
                    // Si ya existe un error para este campo, no validar de nuevo
                    $shouldValidate = !in_array('invalid_nif', $errors->get_error_codes());
                    $shouldValidate = apply_filters('stel_woocommerce_validate_nif', $shouldValidate);
                    if ($shouldValidate) {
                        error_log('Should not validate');
                        return;
                    }
                    $match = preg_match('/[0-9A-Z]{8,10}/', $field_value);
                    if (0 === $match || false === $match) {
                        $errors->add('invalid_nif', 'Please ensure your NIF matches the correct format.');
                    }
                }
            },
            10,
            3
        );
		*/
    }

}
