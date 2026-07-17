<?php

namespace Stel\Verifactu\Domain;

class Utils {
    public static function checkIsValidUUID( string $uuid ): bool {
        return !empty($uuid) && preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid ) === 1;
    }

    public static function checkNotEmptyString( string $value ): bool {
        return !empty(trim($value));
    }

    public static function checkIsPositiveInt( int $value ): bool {
        return $value > 0;
    }
}