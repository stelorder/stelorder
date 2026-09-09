<?php

namespace Stel\Verifactu\Controllers\DTOs;

use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;

class PublishProductsDto {

    public function __construct(
        #[Assert\NotNull]
        #[Assert\Type('array')]
        #[Assert\Count(min: 1, max:500)]
        #[Assert\All([
            new Assert\Type('int'),
            new Assert\GreaterThan(0),
        ])]
        public array $productIds,
    ) {}

}