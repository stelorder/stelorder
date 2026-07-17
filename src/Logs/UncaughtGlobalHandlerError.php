<?php

namespace Stel\Verifactu\Logs;


class UncaughtGlobalHandlerError {
    private static ?UncaughtGlobalHandlerError $instance = null;
	// Flags to prevent re-entrance
	private static bool $handlingException = false;
    private static bool $handlingShutdown = false;
	private static bool $handlingWpDie = false;

    private function __construct() {
		// Private constructor to prevent direct instantiation
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register() {
        // Para excepciones no controladas en try/catch
        set_exception_handler([$this, 'handleException']);
        // Para errores fatales (compilación, casting, etc) que no pasan por try/catch
        register_shutdown_function([$this, 'handleShutdown']);
        // Para llamadas a wp_die()
        add_filter('wp_die_handler', [$this, 'wrapWpDieHandler']);
        add_filter('wp_die_ajax_handler', [$this, 'wrapWpDieHandler']);
        add_filter('wp_die_json_handler', [$this, 'wrapWpDieHandler']);
        add_filter('wp_die_jsonp_handler', [$this, 'wrapWpDieHandler']);
    }

    public function handleException(\Throwable $e) {
		if (self::$handlingException) {
			return;
		}
		self::$handlingException = true;
        try {
            error_log('Handling error from UncautchGlobalHandlerException');
            $pluginDir = wp_normalize_path(STEL_VERIFACTU_PLUGIN_DIR);

            $file = wp_normalize_path($e->getFile());

            if ( ! str_starts_with( $file, $pluginDir ) ) {
                error_log((string) $e);
                return;
            }

            Logger::addLog( [
	            'type'          => 'uncaught_global_handler_exception',
	            'error'       => get_class($e),
	            'class_name'     => $e->getFile(),
	            'message_error' => LogUtils::printThrowableTrace($e),
	            'instance'    => TransientLog::INSTANCE_ERROR
            ] );
        } catch (\Throwable $innerException) {
            error_log('Captured: ' . (string) $innerException);
        } finally {
	        self::$handlingException = false;
        }
    }

    public function handleShutdown(): void {
        if (self::$handlingShutdown) {
            return;
        }
        self::$handlingShutdown = true;
        try {
            error_log('Handling shutdown from UncautchGlobalHandlerException');

            $error = error_get_last();
            if (empty($error) || empty($error['type'])) {
                return;
            }

            $fatalTypes = [
                E_ERROR,
                E_PARSE,
                E_CORE_ERROR,
                E_COMPILE_ERROR,
                E_USER_ERROR,
                E_RECOVERABLE_ERROR,
            ];

            if (!in_array((int) $error['type'], $fatalTypes, true)) {
                return;
            }

            $pluginDir = wp_normalize_path(STEL_VERIFACTU_PLUGIN_DIR);
            $file = wp_normalize_path($error['file'] ?? '');

            if ( ! str_starts_with( $file, $pluginDir ) ) {
                return;
            }

            Logger::addLog( [
	            'type'     => 'uncaught_global_handler_shutdown_exception',
	            'message_error'  => $error['message'] ?? null,
	            'class_name'     => $error['file'] ?? null,
	            'instance' => TransientLog::INSTANCE_ERROR

            ] );
        } catch (\Throwable $innerException) {
            error_log('Captured shutdown error: ' . (string) $innerException);
        } finally {
            self::$handlingShutdown = false;
        }
    }


    private function isWpDieFromCurrentPlugin() : string{
        $trace = wp_debug_backtrace_summary(null, 0, false);
        if (is_array($trace)) {
            // Filtramos cualquier línea que provenga de esta misma clase (el handler o closures internos)
            // para evitar que el mecanismo de intercepción sea detectado como el causante.
            $trace = array_filter($trace, function($line) {
                return !str_contains($line, 'UncaughtGlobalHandlerError');
            });

            $trace = implode("\n", $trace);
        }
		error_log('Trace: ' . $trace);
        return (string) $trace;
    }

    private static function isWpDieFromPlugin(string $trace): bool {
        return str_contains($trace, 'Stel\\Verifactu\\');
    }

    public function wrapWpDieHandler($handler): \Closure {
        $originalHandler = $handler;

        return function ($message, $title = '', $args = []) use ($originalHandler) {
            if (!self::$handlingWpDie) {
                self::$handlingWpDie = true;
                try {
                    $trace = $this->isWpDieFromCurrentPlugin();
                    if (!self::isWpDieFromPlugin($trace)) {
	                    return call_user_func($originalHandler, $message, $title, $args);
                    }

                    Logger::addLog( [
	                    'type'    => 'uncaught_global_handler_wp_die_exception',
	                    'message_error' =>
		                    'Trace: ' . $trace . "\n".
		                    'Cause: ' . (is_string($message) ? $message : json_encode($message)),
	                    'instance'   => TransientLog::INSTANCE_ERROR
                    ] );
                } catch (\Throwable $e) {
                    error_log('Error logging wp_die: ' . (string) $e);
                } finally {
                    self::$handlingWpDie = false;
                }
            }

            // Continuamos con el handler original
            return call_user_func($originalHandler, $message, $title, $args);
        };
    }
}
