<?php

namespace Stel\Verifactu\Controllers\DTOs;

use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Attribute\Ignore;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Attribute\SerializedName;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;

class SaveExternalProduct {

    private const TEXT_FIELDS = ['id', 'name', 'sku', 'global_unique_id', 'price'];
    #[Ignore]
    public int $parent_id;
    #[Ignore]
    public int $variation_id;
    public function __construct(

        #[Assert\Type('string')]
        #[Assert\NotBlank(allowNull: true)]
        #[Assert\Regex(
            pattern: '/^[1-9]\d{0,19}(-[1-9]\d{0,19})?$/',
            message: 'ID must be a numeric string, optionally with a single hyphen separating two numeric parts (e.g., "12345" or "12345-67890").'
        )]
        public ?string $id = null,

        #[Assert\Type('integer')]
        #[Assert\Positive]
        #[SerializedName('external-id')]
        public ?int $externalId = null,

        // price: llega como string desde JSON ("12.99"), lo validamos como string numérico
        #[Assert\Type('string')]
        #[Assert\NotBlank(allowNull: true)]
        #[Assert\Regex(
            pattern: '/^\d+(\.\d{1,5})?$/',
            message: 'Price must be a valid positive decimal number. Decimal separator must be a dot and up to 5 decimal places are allowed.'
        )]
        public ?string $price = null,

        #[Assert\Type('string')]
        #[Assert\Length(max: 100)]
        #[Assert\Regex(
            pattern: '/^[a-zA-Z0-9\-_\.]+$/',
            message: 'global_unique_id must be a valid GTIN (8, 12, 13 or 14 digits).'
        )]
        public ?string $global_unique_id = null,

        #[Assert\Type('float')]
        public ?float $stock_quantity = null,

        // SKU: texto plano, sin HTML, longitud razonable
        #[Assert\Type('string')]
        //#[Assert\NotBlank(allowNull: true)]
        #[Assert\Length(min: 0, max: 100)]
        #[Assert\Regex(
            pattern: '/^[a-zA-Z0-9\-_\.]+$/',
            message: 'SKU must contain only alphanumeric characters, hyphens, underscores or dots.'
        )]
        public ?string $sku = null,

        // name: texto plano, sin HTML
        #[Assert\Type('string')]
        #[Assert\NotBlank(allowNull: true)]
        #[Assert\Length(min: 1, max: 255)]
        public ?string $name = null,

        // description: sin límite artificial de longitud
        #[Assert\Type('string')]
        public ?string $description = null,

	    // Array de URLs de imágenes
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
        foreach (self::TEXT_FIELDS as $field) {
            if (isset($this->$field) && is_string($this->$field)) {
                $this -> $field = sanitize_text_field($this->$field);
            }
        }

        if ($this->description !== null) {
            $this->description = wp_filter_post_kses($this->description);
        }

		if (isset($this->id)) {
			[ $this->parent_id, $this->variation_id ] = $this->parseId( $this->id );
		}

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