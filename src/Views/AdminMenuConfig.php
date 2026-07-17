<?php

namespace Stel\Verifactu\Views;

class AdminMenuConfig {
    private static AdminMenuConfig $instance;
    private $adminView;
    private $logView;
    private function __construct() {
        add_action( 'admin_menu', [$this, 'addAdminMenu'] );
        add_action( 'admin_menu', [$this, 'addSubmenu'] );
        error_log('AdminMenuConfig initialized');
    }
    public static function getInstance(): AdminMenuConfig {
        if (!isset(self::$instance)) {
            self::$instance = new AdminMenuConfig();
        }
        return self::$instance;
    }

    public function addAdminMenu() {
        add_menu_page(
            'STEL Verifactu',     // Título de la página
            'STEL Verifactu',                     // Título del menú
            'read_stel_logs',                // Capacidad requerida
            StelVerifactuMainPage::NAME,        // Slug
            [\Stel\Verifactu\Views\StelVerifactuMainPage::class, 'render'],    // Función callback
            'dashicons-share', // Icono
            30  // Posición
        );
    }

    public function addSubmenu() {
        add_submenu_page(
            'stel-verifactu',       // Slug del menú padre
            'STEL Verifactu Logs',              // Título de la página
            'Logs',                         // Título del menú
            'read_stel_logs',                // Capacidad requerida
            'stel-verifactu-logs',        // Slug
            [\Stel\Verifactu\Views\StelVerifactuLogPage::class, 'render']                   // Función callback
        );
    }

}