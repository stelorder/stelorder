<?php

namespace Stel\Verifactu\Controllers\DTOs;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Constraints as Assert;
class QueryJobsDto {
    public function __construct(
        #[Assert\Type('digit', message: 'firstElement must be a string representing a non-negative integer.')]
        public string $firstElement = '0',
        #[Assert\Type('digit', message: 'pageSize must be a string representing a positive integer.')]
        #[Assert\Range(min:5, max: 500)]
        public string $pageSize = '5',
        #[Assert\Choice(choices: ['creationDateTime', 'direction', 'status'])]
        public string $sortBy = 'creationDateTime',
        #[Assert\NotBlank]
        #[Assert\Choice(choices: ['asc', 'desc'])]
        public string $sortDirection = 'desc',
    ) {}

    public function getQueryArgs(): array {
        return [
            'firstElement' => absint($this->firstElement),
            'pageSize' => absint($this->pageSize),
            'sortBy' => $this->sortBy,
            'sortDirection' => $this->sortDirection,
        ];
    }
}
