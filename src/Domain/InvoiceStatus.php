<?php

namespace Stel\Verifactu\Domain;

enum InvoiceStatus: string {
   case EDITED = 'EDITED';

   public function getMessage(): string {
      return match($this) {
         self::EDITED => 'The invoice has been edited after its issuance.',
      };
   }
}