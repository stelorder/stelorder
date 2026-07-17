<?php

namespace Stel\Verifactu\Repositories;

use WC_Tax;

class TaxRepository {
    private static $instance = null;
    private function __construct() {
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getStandardRates() {
        $stadardRates = WC_Tax::get_rates() ?? [];
        $dataResult = [];
        foreach ($stadardRates as $key => $rate) {
            $dataResult[] = [
                'id' => $key,
                'rate' => $rate['rate'],
                'label' => $rate['label'],
                'shipping' => $rate['shipping'] === 'yes' ? true : false,
                'compound' => $rate['compound'] === 'yes' ? true : false,
            ];
        }
        return $dataResult;
    }
}