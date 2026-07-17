<?php

namespace Stel\Verifactu\Controllers\DTOs;

use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;

class QueryProductsDto {
	private const TEXT_FIELDS = ['name', 'sku', 'global_unique_id'];

	public function __construct(
		#[Assert\Type('string')]
		#[Assert\NotBlank(allowNull: true)]
		#[Assert\Length(min: 1, max: 255)]
		public ?string $name = null,
		#[Assert\Type('string')]
		//#[Assert\NotBlank(allowNull: true)]
		#[Assert\Length(min: 0, max: 100)]
		#[Assert\Regex(
			pattern: '/^[a-zA-Z0-9\-_\.]+$/',
			message: 'SKU must contain only alphanumeric characters, hyphens, underscores or dots.'
		)]
		public ?string $sku = null,
		#[Assert\Type('string')]
		#[Assert\NotBlank(allowNull: true)]
		#[Assert\Length(max: 100)]
		#[Assert\Regex(
			pattern: '/^([0-9]\-)*[0-9]+?$/',
			message: 'global_unique_id must be a valid GTIN (8, 12, 13 or 14 digits).'
		)]
		public ?string $global_unique_id = null,
	){
		foreach (self::TEXT_FIELDS as $field) {
			if (isset($this->$field) && is_string($this->$field)) {
				$this -> $field = sanitize_text_field($this->$field);
			}
		}
	}

}