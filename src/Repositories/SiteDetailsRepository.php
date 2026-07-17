<?php

namespace Stel\Verifactu\Repositories;

use Stel\Verifactu\Domain\SiteDetails;

class SiteDetailsRepository {
    private static ?SiteDetailsRepository $instance = null;

    public static function getInstance(): SiteDetailsRepository {
        if (self::$instance === null) {
            self::$instance = new SiteDetailsRepository();
        }
        return self::$instance;
    }

    private function __construct() {
    }

    public function getSiteDetails(): SiteDetails {
        $siteName = get_bloginfo('name') ?: null;
        $domain = wp_parse_url(home_url(), PHP_URL_HOST) ?: null;
        $logoId = get_option('site_icon', false);
        $logoUrl = $logoId ? wp_get_attachment_image_url($logoId) : null;


        return new SiteDetails($domain, $siteName, $logoUrl);
    }


}