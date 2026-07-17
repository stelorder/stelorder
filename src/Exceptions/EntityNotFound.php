<?php

namespace Stel\Verifactu\Exceptions;

class EntityNotFound extends \Exception {
    public function __construct($message = "No se ha encontrado la entidad solicitada", $code = 404, ?\Exception $previous = null) {
        parent::__construct($message, $code, $previous);
    }
}