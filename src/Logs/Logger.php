<?php

namespace Stel\Verifactu\Logs;

use Stel\Verifactu\App;

class Logger {

	public static function addLog( string|array $message, $notify = true ) {
		// Verifica si la opción ya existe
		if ( ! get_option( App::LOG_OPT_NAME ) ) {
			// Crea la opción con autoload = no
			add_option( App::LOG_OPT_NAME, [], '', 'no' );
		}

		// Obtiene los logs existentes
		$logs = get_option( App::LOG_OPT_NAME, [] );

		$logMsg = sprintf( "[%s] %s", current_time( 'mysql' ),
			is_array( $message ) ?
				json_encode( $message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT )
				: $message
		);

		// Agrega el nuevo log
		$logs[] = $logMsg;

		if ( $notify ) {
			do_action( 'stel_log_added', $message );
		}

		// Actualiza la opción con los nuevos logs
		update_option( App::LOG_OPT_NAME, $logs );
	}
}
