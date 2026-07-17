<?php

namespace Stel\Verifactu\Views;

use Stel\Verifactu\App;

if (!defined('ABSPATH')) {
    exit; // Evita el acceso directo
}

class StelVerifactuLogPage {
    // Función que muestra la página de logs
    public static function render() { 
        if ( ! current_user_can( 'read_stel_logs' ) ) {
            wp_die( '<div class="notice notice-error"><p>No tienes permisos para acceder a esta página.</p></div>' );
        }
        
        // Eliminamos logs si se envió el formulario y se validó el nonce
        if ( isset( $_POST['clear_logs'] ) && current_user_can( 'delete_stel_logs' ) && check_admin_referer( 'stel_clear_logs_action', 'stel_clear_logs_nonce' ) ) {
            App::clearLogs();
            // Opcional: mostrar notificación de éxito
            echo '<div class="notice notice-success is-dismissible"><p>Logs eliminados correctamente.</p></div>';
        }

        $logs = App::getLogs();

        ?>
        <div class="wrap">
            <h1>Logs de Stel Integrations</h1>
            <form method="post">
                <?php wp_nonce_field( 'stel_clear_logs_action', 'stel_clear_logs_nonce' ); ?>
                <?php if(current_user_can( 'manage_options' )): ?>
                    <input type="submit" name="clear_logs" class="button button-secondary" value="Eliminar logs">
                <?php endif; ?>
            </form>
            <?php if ( !empty( $logs ) ) : ?>
                <ul>
                    <?php foreach ( $logs as $log ) : ?>
                        <li><?php echo esc_html( $log ); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php else : ?>
                <p>No hay logs registrados.</p>
            <?php endif; ?>
        </div>
        <?php
    }
}