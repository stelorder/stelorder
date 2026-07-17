<?php

namespace Stel\Verifactu\Controllers\Utils;

class RestUtils
{
    public static function getCurrentRestUrl(): string{
        $uri = isset($_SERVER['REQUEST_URI'])
            ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI']))
            : '';
        // Obtenemos el path para evitar problemas con instalaciones en subdirectorios
        $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH) ?? '/';
        // Obtenemos el prefijo de la REST API
        $prefix = trailingslashit(rest_get_url_prefix());
        // Construimos la cadena a buscar
        $needle = trailingslashit($home_path) . $prefix;
        // Obtenemos la posición del prefijo en la URL
        $pos = strpos($uri, $needle);
        // Comprobamos si estamos accediendo a la REST API
        if ($pos === false) {
            return '';
        }
        // Obtenemos la ruta después del prefijo de la REST API, conservando la barra inicial
        $route = substr($uri, $pos + strlen($needle) - 1);
        // Quitamos la querystring si la hay
        $route = strtok($route, '?');
        return $route ?: '';

    }
}
