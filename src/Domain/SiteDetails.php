<?php

namespace Stel\Verifactu\Domain;

class SiteDetails {
    private ?string $domain;
    private ?string $siteName;
    private ?string $logoUrl;

    public function __construct(?string $domain, ?string $siteName, ?string $logoUrl) {
        $this->domain = $domain;
        $this->siteName = $siteName;
        $this->logoUrl = $logoUrl;
    }

    public function getDomain(): ?string {
        return $this->domain;
    }

    public function getSiteName(): ?string {
        return $this->siteName;
    }

    public function getLogoUrl(): ?string {
        return $this->logoUrl;
    }
}