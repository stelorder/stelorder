<?php

namespace Stel\Verifactu\Views;

use Stel\Verifactu\Repositories\IntegrationRepository;
use Stel\Verifactu\Services\StelService;
class SpaConfig
{
    private const VITE_CLIENT = 'stel-verifactu-vite-client';
    private const MY_PLUGIN_REACT_APP = 'stel-verifactu-mi-plugin-react-app';
    private const VITE_REACT_REFRESH_PREAMBLE = 'stel-verifactu-vite-react-refresh-preamble';
    private static $instance;
    private function __construct()
    {
        add_action('admin_enqueue_scripts', [$this, 'enqueueSpa']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueSpaCss']);
        error_log('SpaConfig initialized');
    }
    public static function getInstance(): SpaConfig
    {
        if (!isset(self::$instance)) {
            self::$instance = new SpaConfig();
        }
        return self::$instance;
    }

    /**
     * Obtiene la URL del archivo index-*.css generado por Vite.
     *
     * @return string|false La URL del archivo si se encuentra, o false si no se encuentra.
     */
    private function getBundleCssFile()
    {
        // En modo desarrollo, Vite normalmente inyecta los CSS automáticamente
        if (defined('STEL_DEBUG') && defined('STEL_ENV_DEVELOP') && STEL_ENV_DEVELOP === true) {
            return false;
        }

        // Ruta absoluta del directorio donde se generará el bundle
        $bundle_dir = STEL_VERIFACTU_PLUGIN_DIR . 'assets/css';

        // Buscar el archivo que coincide con el patrón "index-*.css"
        $files = glob($bundle_dir . '/index-*.css');
        if (!empty($files)) {
            // Obtener el primer archivo que coincida
            $bundle_path = $files[0];
            return STEL_VERIFACTU_PLUGIN_URL . 'assets/css/' . basename($bundle_path);
        }

        // Si no se encuentra ningún archivo, registrar un error
        error_log('No se encontró ningún archivo index-*.css en el directorio: ' . $bundle_dir);
        return false;
    }

    /**
     * Encola el CSS generado por Vite en la página de administración del plugin.
     *
     * @param string $hook El hook de la página actual.
     */
    public function enqueueSpaCss($hook)
    {
        // Verifica que estamos en la página de tu plugin antes de encolar el CSS
        if ($hook !== 'toplevel_page_' . StelVerifactuMainPage::NAME) {
            return;
        }


        // Obtener la URL del archivo index-*.css
        $css_url = $this->getBundleCssFile();
        if ($css_url) {
            error_log('CSS file found: ' . $css_url);
            // Encolar el archivo CSS
            wp_enqueue_style('stel-verifactu-mi-plugin-react-css', $css_url, array(), '1.0.0');
        }
    }

    /**
     * Obtiene la URL del archivo index-*.js generado por Vite.
     *
     * @return string|false La URL del archivo si se encuentra, o false si no se encuentra.
     */
    private function getViteBundleFile() {
        
        // Ruta absoluta del directorio donde se generará el bundle
        $bundle_dir = STEL_VERIFACTU_PLUGIN_DIR . 'assets/js';

        // Si el directorio no existe, créalo
        if (!file_exists($bundle_dir)) {
            wp_mkdir_p($bundle_dir);
        }

        // Buscar el archivo que coincide con el patrón "index-*.js"
        $files = glob($bundle_dir . '/index-*.js');
        if (!empty($files)) {
            // Obtener el primer archivo que coincida
            $bundle_path = $files[0];
            return STEL_VERIFACTU_PLUGIN_URL . 'assets/js/' . basename($bundle_path);
        }

        // Si no se encuentra ningún archivo, registrar un error
        error_log('No se encontró ningún archivo index-*.js en el directorio: ' . $bundle_dir);
        return false;
    }

    public function enqueueSpa($hook)
    {
        // Verificamos que estamos en la página principal antes de encolar el script
        if ($hook !== 'toplevel_page_' . StelVerifactuMainPage::NAME) {
            return;
        }

        // Aseguramos que los scripts sean compatibles con módulos ES6
        add_filter('script_loader_tag', function ($tag, $handle) {

            if (in_array($handle, [self::VITE_CLIENT, self::MY_PLUGIN_REACT_APP])) {
                return str_replace(
                    '<script ',
                    '<script type="module" ',
                    $tag
                );
            }
            return $tag;
        }, 10, 2);

        if (defined('STEL_DEBUG') && defined('STEL_ENV_DEVELOP') && STEL_ENV_DEVELOP === true) {
            // 0. Inyectar el script de Vite client como módulo
            wp_register_script(self::VITE_REACT_REFRESH_PREAMBLE, false, [], null, false); // false = <head>
            wp_enqueue_script(self::VITE_REACT_REFRESH_PREAMBLE);
            wp_add_inline_script(self::VITE_REACT_REFRESH_PREAMBLE, $this->getVitePreambleInlineScript(), 'before');

            add_filter('wp_inline_script_attributes', function (array $attributes, string $data): array {
                if (str_contains($data, '@react-refresh')) {  // identifica el script por su contenido
                    $attributes['type'] = 'module';
                }
                return $attributes;
            }, 10, 2);
            // 1. Cargar el cliente de Vite HMR (requerido para React Refresh)
            wp_enqueue_script(
                self::VITE_CLIENT,
                'http://localhost:5173/@vite/client',
                array(),
                null,
                true
            );

            // 2. Cargar el entry point de React como módulo
            wp_enqueue_script(
                self::MY_PLUGIN_REACT_APP,
                'http://localhost:5173/src/main.tsx',
                array(self::VITE_CLIENT), // Dependencia del cliente Vite
                null,
                true
            );

            

        } else {
            // Obtener la URL del archivo JS
            $bundle_url = $this->getViteBundleFile();
            if (!$bundle_url) {
                error_log('No se pudo encontrar el archivo JS bundle');
                return;
            }

            error_log('Loading JS from: ' . $bundle_url);

            // Encolar el script
            wp_enqueue_script(self::MY_PLUGIN_REACT_APP, $bundle_url, array(), null, true);

        }
        $repository = IntegrationRepository::getInstance();
        $integration = $repository->get();
        $data = array(
            'root' => esc_url_raw(rest_url()),
            'wpAdminUrl' => esc_url_raw(admin_url()),
            'stelServiceUrl' => StelService::STEL_API_MICROSERVICE_URL,
            'stelUrl' => StelService::STEL_INTEGRATIONS_URL,
            'pluginUrl' => STEL_VERIFACTU_PLUGIN_URL,
            'integration' => array(
                'integrationId' => $integration?->getIntegrationId()
            ),
            'nonce' => wp_create_nonce('wp_rest'),
            'isDebug' => defined('STEL_DEBUG')
        );

        // Pasar configuración de la API al script de React
        $inlineContent = 'const settings = ' . wp_json_encode($data) . '; Object.freeze(settings);';
        $inlineContent .= 'Object.defineProperty(window, "wpApiSettings", { value: settings, writable: false, configurable: false });';
        wp_add_inline_script(self::MY_PLUGIN_REACT_APP, $inlineContent, 'before');
    }

    private function getVitePreambleInlineScript(): string {
        return '
            import RefreshRuntime from "http://localhost:5173/@react-refresh"
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
        ';
    }
}
