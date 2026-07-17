<?php

namespace Stel\Verifactu\Repositories;

class ProductVariationRepository extends WCDataRepository {
    protected function getResourceClass(): string {
        return 'WC_Product_Variation';
    }
}
