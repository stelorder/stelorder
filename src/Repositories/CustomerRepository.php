<?php

namespace Stel\Verifactu\Repositories;

class CustomerRepository extends WCDataRepository {
    protected function getResourceClass(): string {
        return 'WC_Customer';
    }
}