<?php

namespace Stel\Verifactu\Controllers\DTOs;

interface Serializable
{
    public function __serialize(): array;
}
