<?php

namespace Stel\Verifactu\Logs;

class TransientLog {
	public const INSTANCE_LOG = 'log';
	public const INSTANCE_ERROR = 'error';
    private static ?string $localRequestId = null;

    public static function getLocalRequestId(): string {
        if (self::$localRequestId === null) {
            self::$localRequestId = wp_generate_uuid4();
        }
        return self::$localRequestId;
    }

    private string $id;
    private ?string $requestId;
    private string $logContent;
    private ?string $createdAt;

    public function __construct(string | array $logContent) {
        $this->id = wp_generate_uuid4();
        $this->requestId = self::getLocalRequestId();
        $this->createdAt = gmdate('Y-m-d H:i:s');
        if (is_string($logContent)) {
			$logContent = [
				'message_log' => $logContent,
				'instance' => self::INSTANCE_LOG
			];
		}
	    $jsonContent = json_encode($logContent);
	    if ($jsonContent === false) {
		    $this->logContent = '{"message_log":"[Unserializable log content]","instance":"'.(self::INSTANCE_ERROR).'"}';
	    } else {
		    $this->logContent = $jsonContent;
	    }
    }

    private static function initFromRow (array $data): TransientLog {
		$logContent = $data['log_content'] ?? '';
		$logContent = json_decode( $logContent, true );
		if ( !is_array( $logContent )) {
			$logContent = '';
		}
        $log = new TransientLog( $logContent );
        $log->requestId = $data['request_id'] ?? null;
        $log->id = $data['id'] ?? null;
        $createdAt = $data['created_at'] ?? null;
	    if (is_string($createdAt) && $createdAt !== '') {
		    try {
			    $dt = new \DateTime($createdAt, new \DateTimeZone('UTC'));
			    $log->createdAt = $dt->format('Y-m-d\TH:i:s\Z');
		    } catch (\Exception $e) {
			    $log->createdAt = null;
		    }
	    } else {
		    $log->createdAt = null;
	    }
        return $log;
    }

    public static function initSchema(): void {
        global $wpdb;
        $charsetCollate = $wpdb->get_charset_collate();
        $result = $wpdb->query("
            CREATE TABLE IF NOT EXISTS {$wpdb->base_prefix}stel_transient_logs (
                id VARCHAR(36) NOT NULL,
                request_id VARCHAR(36) DEFAULT NULL,
                log_content LONGTEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB {$charsetCollate};
        ");
        if ($result === false) {
            $errors = $wpdb->last_error;
            error_log("Error creating transient logs table: {$errors}");
        }
    }

    public static function dropSchema(): void {
        global $wpdb;
        $result = $wpdb->query("DROP TABLE IF EXISTS {$wpdb->base_prefix}stel_transient_logs;");
        if ($result === false) {
            $errors = $wpdb->last_error;
            error_log("Error deleting transient logs table: {$errors}");
        }
    }

    public function getId(): string {
        return $this->id;
    }

    public function getRequestId(): string | null {
        return $this->requestId;
    }

    public function getLogContent(): string {
        return $this->logContent;
    }

    public function getCreatedAt(): string | null {
        return $this->createdAt;
    }


    public function save(): bool {
        global $wpdb;
        $result = $wpdb->insert(
            "{$wpdb->base_prefix}stel_transient_logs",
            [
                'id' => $this->id,
                'request_id' => $this->requestId,
                'log_content' => $this->logContent,
                'created_at' => $this->createdAt,
            ],
            [
                '%s',
                '%s',
                '%s',
                '%s',
            ]
        );
        if ($result === false) {
            error_log('Error saving transient log.');
            return false;
        }
        return true;
    }

    /**
     * Fetch and delete logs atomically in a transaction
     * @param mixed $limit number of logs to fetch and delete, if $limit is null, fetch all
     * @return TransientLog[] fetched and deleted logs
     */
    public static function atomicShift(?int $limit): array {
        $limtiValue = ($limit === null) ? '' : 'LIMIT ' . max(0, (int) $limit);
        global $wpdb;
        $wpdb->hide_errors();
        // Realizamos la operación dentro de una transacción
        try {
            $wpdb->query('START TRANSACTION');
            // SELECT FOR UPDATE para bloquear los registros a eliminar
            $result = $wpdb->get_results(
                "SELECT * FROM {$wpdb->base_prefix}stel_transient_logs ORDER BY created_at ASC {$limtiValue} FOR UPDATE",
                ARRAY_A
            );
            if ($result === null) {
                throw new \Exception($wpdb->last_error);
            }
            // Eliminamos los registros seleccionados y los devolvemos
            $idsToDelete = array_map(fn($row) => $row['id'], $result);
            if (count($idsToDelete) > 0) {
                $placeholders = implode(',', array_fill(0, count($idsToDelete), '%s'));
                $deleteResult = $wpdb->query(
                    $wpdb->prepare(
                        "DELETE FROM {$wpdb->base_prefix}stel_transient_logs WHERE id IN ({$placeholders})",
                        ...$idsToDelete
                    )
                );
                if ($deleteResult === false) {
                    throw new \Exception($wpdb->last_error);
                }
            }
            // Commit de la transacción
            $wpdb->query('COMMIT');
            return array_map(fn($data) => self::initFromRow($data), $result);
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');
            error_log("Error starting transaction for atomic shift: " . $e->getMessage());
            return [];
        }

    }
}
