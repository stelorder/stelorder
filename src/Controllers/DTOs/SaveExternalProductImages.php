<?php

namespace Stel\Verifactu\Controllers\DTOs;

use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Attribute\Ignore;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;

class SaveExternalProductImages {
    #[Ignore]
    public int $parent_id;
    #[Ignore]
    public int $variation_id;

    public function __construct(
        #[Assert\Type('string')]
        #[Assert\NotBlank]
        #[Assert\Regex(
            pattern: '/^[1-9]\d{0,19}(-[1-9]\d{0,19})?$/',
            message: 'ID must be a numeric string, optionally with a single hyphen separating two numeric parts (e.g., "12345" or "12345-67890").'
        )]
        public string $id,

        #[Assert\Type('array')]
        #[Assert\All([
            new Assert\Type('string'),
            new Assert\Url(),
            new Assert\Regex(
                pattern: '/^http(s)?:\/\/(www\.)?app\.stelorder\.com\//i',
                message: 'Each image URL must start with "http(s)://app.stelorder.com/".'
            )
        ])]
        public ?array $images = null
    ) {
        [ $this->parent_id, $this->variation_id ] = $this->parseId( $this->id );

        if (isset($this->images)) {
            $this->images = array_map(fn ($url) => sanitize_url($url), $this->images);
        }
    }

    private function parseId(string $id): array {
        $parts = explode('-', $id);
        $parent_id = (int) $parts[0];
        $variation_id = isset($parts[1]) ? (int) $parts[1] : 0;
        return [$parent_id, $variation_id];
    }

}