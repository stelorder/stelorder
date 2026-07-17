<?php

namespace Stel\Verifactu;

use Stel\Verifactu\Controllers\Security\SecurityRestFilter;
use Stel\Verifactu\Logs\HttpClientLogger;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Logs\UncaughtGlobalHandlerError;
use Stel\Verifactu\Controllers\StelVerifactuController;
use Stel\Verifactu\Logs\TransientLog;
use Stel\Verifactu\Repositories\OrderMetaRepositoryImpl;
use Stel\Verifactu\Services\Factory\SubscriptionServiceFactory;
use Stel\Verifactu\Services\Impl\WebhookSubscriptionService;
use Stel\Verifactu\Views\AdminMenuConfig;
use Stel\Verifactu\Views\SpaConfig;
use Stel\Verifactu\WooCommerce\CustomFieldsConfig;
use Stel\Verifactu\WooCommerce\HooksConfig;
use Stel\Verifactu\WooCommerce\Utils\ProductChangeTracker;
use Stel\Verifactu\WooCommerce\Views\Orders\OrderListAdminView;
use Stel\Verifactu\WooCommerce\Views\Orders\SingleOrderAdminView;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderMetaBoxStrategy;
use Stel\Verifactu\WooCommerce\Views\Orders\Strategies\RenderOrderListStrategyImpl;
use Stel\Verifactu\WooCommerce\Scheduler\StelLogActionScheduler;
use WP_Http;

class App
{
    public const NAME = 'stel_verifactu';
    public const LOG_OPT_NAME = 'stel_integrations_verifactu_logs';

	public static function getLogs()
    {
        return get_option(self::LOG_OPT_NAME, []);
    }

    public static function clearLogs()
    {
        // Elimina la opción de logs
        update_option(self::LOG_OPT_NAME, []);
    }

    private static function addPluginCapabilities()
    {
        // Añadir capacidades al rol de Editor y Gestor de la tienda
        $editor_role = get_role('editor');
        $shop_manager_role = get_role('shop_manager');
        if ($editor_role) {
            $editor_role->add_cap('read_stel_logs');
        }
        if ($shop_manager_role) {
            $shop_manager_role->add_cap('read_stel_logs');
        }

        // Añadir capacidad al rol de Administrador
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_role->add_cap('read_stel_logs');
            $admin_role->add_cap('delete_stel_logs');
        }
    }

    private static function removePluginCapabilities()
    {
        // Eliminar capacidades del rol de Editor y Gestor de la tienda
        $editor_role = get_role('editor');
        $shop_manager_role = get_role('shop_manager');
        if ($editor_role) {
            $editor_role->remove_cap('read_stel_logs');
        }
        if ($shop_manager_role) {
            $shop_manager_role->remove_cap('read_stel_logs');
        }

        // Eliminar capacidades del rol de Administrador
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_role->remove_cap('read_stel_logs');
            $admin_role->remove_cap('delete_stel_logs');
        }
    }


    public static function activate()
    {
        self::addPluginCapabilities();
		$message = 'El plugin Stel Integrations ha sido activado.';
        Logger::addLog( $message, false );
        TransientLog::initSchema();
		$activateLog = new TransientLog($message);
		$activateLog->save();
    }

    public static function deactivate()
    {
        self::removePluginCapabilities();
        ProductChangeTracker::cleanProductTrackedInfo();
        Logger::addLog( 'El plugin Stel Integrations ha sido desactivado.' );
        StelLogActionScheduler::flushAndStop();
        TransientLog::dropSchema();
    }

    private static function checkMinReq(): array
    {
        global $wp_version;
        $unsatisfied = [];
        
        $activePlugins = apply_filters('active_plugins', get_option('active_plugins'));
        $pluginPath = 'woocommerce/woocommerce.php';

        $completeWCPath = path_join(WP_PLUGIN_DIR, $pluginPath);
        if (!file_exists($completeWCPath)) {
            $unsatisfied[] = 'WooCommerce plugin is not installed';
        } elseif (in_array($pluginPath, $activePlugins)) {
            if(class_exists('WooCommerce')) {
                $wcVersion = \WooCommerce::instance()->version;
                if (version_compare($wcVersion, STEL_VERIFACTU_MIN_WC_VERSION, '<')) {
                    $unsatisfied[] = 'WooCommerce version must be at least ' . STEL_VERIFACTU_MIN_WC_VERSION;
                }
            }
        } else {
            $unsatisfied[] = 'WooCommerce plugin is not active';
        }

        if (version_compare(PHP_VERSION, STEL_VERIFACTU_MIN_PHP_VERSION, '<')) {
            $unsatisfied[] = 'PHP version must be at least ' . STEL_VERIFACTU_MIN_PHP_VERSION;
        }

        if (version_compare($wp_version, STEL_VERIFACTU_MIN_WP_VERSION, '<')) {
            $unsatisfied[] = 'WordPress version must be at least ' . STEL_VERIFACTU_MIN_WP_VERSION;
        }

        
        return $unsatisfied;
    }

    private static function deactivateByPluginDependencies($pluginFilePath)
    {

        if (!function_exists(function: 'deactivate_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        self::deactivate();
        Logger::addLog( 'El plugin WooCommerce no existe o no se encuentra activo', false );
        deactivate_plugins(plugin_basename($pluginFilePath));
    }

    public static function load($pluginFilePath)
    {
        StelLogActionScheduler::getInstance();
        UncaughtGlobalHandlerError::getInstance()->register();
        HttpClientLogger::getInstance()->register();
        $unsatisfied = self::checkMinReq();
        if (!empty($unsatisfied)) {
            Logger::addLog( $unsatisfied, false );
            self::deactivateByPluginDependencies($pluginFilePath);
            if (is_admin()) {
                foreach ($unsatisfied as $message) {
                    add_action('admin_notices', function () use ($message) {
                        echo '<div class="notice notice-error is-dismissible">';
                        echo '<p><strong>Stel Verifactu:</strong> ' . esc_html($message) . '</p>';
                        echo '</div>';
                    });
                }
            }
            return;
        }
        
        // Indicamos compatibilidad con las Custom Order Tables de WooCommerce
        add_action( 'before_woocommerce_init', function () use ($pluginFilePath) {
            if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
                    'custom_order_tables',
                    $pluginFilePath,
                    true
                );
            }
        });
        // Añadir las capacidades del plugin
        self::addPluginCapabilities();
        SecurityRestFilter::getInstance();
        HooksConfig::getInstance();
        AdminMenuConfig::getInstance();
        SpaConfig::getInstance();
        SingleOrderAdminView::getInstance(new RenderMetaBoxStrategy());
        OrderListAdminView::getInstance(new RenderOrderListStrategyImpl());
        add_action('woocommerce_init', function () {
            CustomFieldsConfig::getInstance();
            self::loadSubscriptionServiceFactory();
        });
        // Registrar el controlador de la API REST
        StelVerifactuController::getInstance();

    }

    private static function loadSubscriptionServiceFactory(): void
    {
        // Inicializar la fábrica de servicios de suscripción
        $factory = SubscriptionServiceFactory::getInstance();
        $defaultService = WebhookSubscriptionService::getInstance();
        $factory->registerSubscriber(\WC_Webhook::class, $defaultService);
        $factory->setDefaultSubscriber($defaultService);
    }

}
