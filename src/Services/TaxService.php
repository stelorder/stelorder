<?php

namespace Stel\Verifactu\Services;

use Stel\Verifactu\Repositories\TaxRepository;

class TaxService {
    private static $instance = null;
    private TaxRepository $taxRepository;

    private function __construct() {
        $this->taxRepository = TaxRepository::getInstance();
    }

    public static function getInstance(): TaxService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getStandardRates() {
        return $this->taxRepository->getStandardRates();
    }
}