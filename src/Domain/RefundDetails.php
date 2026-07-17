<?php

namespace Stel\Verifactu\Domain;

class RefundDetails {
    private int $externalId;
    private string $pdfUrl;

    private string $createdDate;

    public function __construct(int $externalId, string $pdfUrl, string $createdDate) {
        if (!Utils::checkIsPositiveInt($externalId)) {
            throw new \InvalidArgumentException('External ID must be a positive integer.');
        }
        if (!empty($pdfUrl) && !filter_var($pdfUrl, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException('PDF URL must be a valid URL.');
        }
        if (!empty($createdDate) && !strtotime($createdDate)) {
            throw new \InvalidArgumentException('Created date must be a valid date string.');
        }
        $this->externalId = $externalId;
        $this->pdfUrl = $pdfUrl;
        $this->createdDate = $createdDate;
    }

    public function getExternalId(): int {
        return $this->externalId;
    }

    public function getPdfUrl(): string {
        return $this->pdfUrl;
    }

    public function getCreatedDate(): string {
        return $this->createdDate;
    }

    
}