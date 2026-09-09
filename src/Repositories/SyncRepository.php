<?php

namespace Stel\Verifactu\Repositories;

use Stel\Verifactu\App;
use Stel\Verifactu\Domain\SyncEntityType;

class SyncRepository {
    private static ?SyncRepository $instance = null;

    private function __construct() {
    }

    public static function getInstance(): SyncRepository {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getSyncEntity(SyncEntityType $type): ?string {
        $optionKey = App::NAME . '_sync_entity_' . $type->value;
        $optionValue = get_option($optionKey, null);
        if ($optionValue === null) return null;
        return (string) $optionValue;
    }

    public function saveSyncEntity(SyncEntityType $type, string $value): bool {
        $optionKey = App::NAME . '_sync_entity_' . $type->value;
        return update_option($optionKey, $value);
    }

    public function deleteSyncEntity(SyncEntityType $type): bool {
        $optionKey = App::NAME . '_sync_entity_' . $type->value;
        return delete_option($optionKey);
    }


}