<?php

namespace Stel\Verifactu\Domain;

enum EventActionType: string {
    case CREATE = "CREATE";
    case UPDATE = "UPDATE";
    case DELETE = "DELETE";
}