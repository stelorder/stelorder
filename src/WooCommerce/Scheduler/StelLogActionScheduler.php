<?php

namespace Stel\Verifactu\WooCommerce\Scheduler;

use Stel\Verifactu\Logs\LogUtils;
use Stel\Verifactu\Logs\TransientLog;
use Stel\Verifactu\Repositories\IntegrationRepository;
use Stel\Verifactu\Services\StelService;

class StelLogActionScheduler {
    private static ?StelLogActionScheduler $instance = null;
    private const SHIFT_LOGS_HOOK  = 'stel_verifactu_shift_transient_logs';
    private const SHIFT_LOGS_GROUP = 'stel-verifactu';
    private const EVERY_MINUTES = 5;

	private bool $listeningAddLog = false;

    public static function getInstance() {
        if ( self::$instance === null ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->loadCustomActions();
        $this->intiScheduler();
    }

    public function intiScheduler() {
        if ( did_action( 'action_scheduler_init' ) ) {
            $this->scheduleShiftLogsAction();
            return;
        }

        add_action('action_scheduler_init', function() {
            $this->scheduleShiftLogsAction();
        });
    }
    
    private function loadCustomActions() {
		$this->startListeningAddLog();
		// Registrar la acción para procesar los logs temporales
        add_action(self::SHIFT_LOGS_HOOK, function() {
            $this->processTransientLogs();
        }, 10, 0);
    }

	public function startListeningAddLog(): bool {
		if ( $this->listeningAddLog ) {
			return false;
		}
		add_action('stel_log_added', [$this, 'persistTransientLog'], 10, 1);
		$this->listeningAddLog = true;
		return true;
	}

	public function stopListeningAddLog(): bool {
		if ( ! $this->listeningAddLog ) {
			return false;

		}
		$removed = remove_action( 'stel_log_added', [ $this, 'persistTransientLog' ], 10 );
		$this->listeningAddLog = false;
		return $removed;
	}

	public function isListeningAddLog(): bool {
		return $this->listeningAddLog;
	}

	public function persistTransientLog( array | string $log ): void {
		try {
			$transientLog = new TransientLog($log);
			$transientLog->save();
		} catch (\Throwable $e) {
			error_log("Error in transient log: " . (string) $e);
		}
	}

    public function scheduleShiftLogsAction() {
        if (! function_exists('as_schedule_recurring_action')) {
            return;
        }

        $intervalSeconds = self::EVERY_MINUTES * 60;

        // Si ya hay una acción programada, terminamos
        $next = as_next_scheduled_action(self::SHIFT_LOGS_HOOK, [], self::SHIFT_LOGS_GROUP);
        if ($next) {
            return;
        }

        $firstRun = time() + $intervalSeconds;

        as_schedule_recurring_action(
            $firstRun,
            $intervalSeconds,
            self::SHIFT_LOGS_HOOK,
            [],
            self::SHIFT_LOGS_GROUP
        );
            
    }

    public static function flushAndStop() {
        self::getInstance()->processTransientLogs();
        self::stopScheduleShiftLogsAction();
    }

    public static function stopScheduleShiftLogsAction() {
        if (! function_exists('as_unschedule_all_actions')) {
            return;
        }

        as_unschedule_all_actions(self::SHIFT_LOGS_HOOK, [], self::SHIFT_LOGS_GROUP);
    }

    public function processTransientLogs() {

		try {
			// Stop the listener to avoid reentrant calls for the current processing
			$this->stopListeningAddLog();
			$integration = IntegrationRepository::getInstance()->get();
			if ( ! $integration ) {
				return;
			}

	        $logs = TransientLog::atomicShift(null);

			if ( empty( $logs ) ) {
				return;
			}

	        StelService::getInstance()->notifyTransientLogs($logs, $integration->getIntegrationId(), $integration->getToken());
        } catch (\Throwable $e) {
	        $this->persistTransientLog([
		        'type' => 'stel_log_action_scheduler_error',
		        'class_name' => __CLASS__,
				'instance' => TransientLog::INSTANCE_ERROR,
		        'message_error' => LogUtils::printThrowableTrace($e)
	        ]);
		} finally {
			// Restart the listener
			$this->startListeningAddLog();
		}
    }

    
}
