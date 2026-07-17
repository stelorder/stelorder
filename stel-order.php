<?php

/*
 * Plugin Name: Stel Order
 * Description: Connect WooCommerce with STEL Order and sync orders, invoices, customers and products.
 * Plugin URI: https://www.stelorder.com/integraciones/woocommerce/
 * Version: 1.0.0
 * Author: stelorder
 * Author URI: https://stelorder.com
 *
 * Requires at least: 6.5
 * Tested up to: 7.0
 * Requires PHP: 8.2
 *
 * Requires Plugins: woocommerce
 * WC requires at least: 9.2.1
 * WC tested up to: 9.9.5
 *
 * Text Domain: stel-order
 * Domain Path: /languages
 *
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */
/*
Copyright 2025 Stel

Stel Order is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

Stel Order is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this plugin. If not, see https://www.gnu.org/licenses/gpl-2.0.html. 
*/

use Stel\Verifactu\App;

if (! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

define('STEL_VERIFACTU_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('STEL_VERIFACTU_PLUGIN_URL', plugin_dir_url(__FILE__));
const STEL_VERIFACTU_MIN_WP_VERSION = '6.5.0';
const STEL_VERIFACTU_MIN_PHP_VERSION = '8.2.0';
const STEL_VERIFACTU_MIN_WC_VERSION = '9.2.0';

add_action('plugins_loaded', function () {
    App::load(__FILE__);
}, 20);


function stel_integrations_verifactu_activate()
{
    // Activar el plugin
    App::activate();
}

function stel_integrations_verifactu_deactivate()
{
    // Desactivar el plugin
    App::deactivate();
}

register_activation_hook(__FILE__, 'stel_integrations_verifactu_activate');
register_deactivation_hook(__FILE__, 'stel_integrations_verifactu_deactivate');
