<?php

namespace Stel\Verifactu\Views;

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Evita el acceso directo
}

class StelVerifactuMainPage {
    public const NAME = 'stel-verifactu';
    public static function render() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( '<div class="notice notice-error"><p>No tienes permisos para acceder a esta página.</p></div>' );
        }
        ?>
        <main class="wrap">
            <div id="root">
            </div>
        </main>
        <?php
    }

}