<?php

namespace Stel\Verifactu\Controllers\DTOs;

use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Attribute\Ignore;
use \Stel\Verifactu\Vendor\Symfony\Component\Serializer\Attribute\SerializedName;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;

class CreateLocalSubscriptionDto {
    public function __construct(
        //assert type
        #[Assert\Type('string')]
        #[Assert\NotNull]
        #[Assert\NotBlank]
        #[Assert\Uuid]
        #[SerializedName('external-id')]
        public ?string $externalId = null,

        #[Assert\Type('string')]
        #[Assert\NotNull]
        #[Assert\NotBlank]
        #[Assert\EqualTo('product')]
        public ?string $name = null,


        /**
         * @template T of object
         * @var class-string<T> The class name of the subscriber service to register.
         */
        #[Ignore]
        public $type = null
    ) {}
}