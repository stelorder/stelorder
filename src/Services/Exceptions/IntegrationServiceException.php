<?php

namespace Stel\Verifactu\Services\Exceptions;

class IntegrationServiceException extends \Exception {
    public function __construct($message = "An error is ocurren in Integration Service", ?\Exception $previous = null) {
        parent::__construct($message, 0, $previous);
    }
}