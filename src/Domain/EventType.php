<?php

namespace Stel\Verifactu\Domain;

enum EventType: string {
    case BASIC = 'BASIC';
    case AWAIT = 'AWAIT';
    case DEFERRED_PUBLISH = 'DEFERRED_PUBLISH';
}