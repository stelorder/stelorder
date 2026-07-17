<?php

namespace Stel\Verifactu\Services;

use Stel\Verifactu\Domain\Integration;
use Stel\Verifactu\Logs\Logger;
use Stel\Verifactu\Logs\LogUtils;
use Stel\Verifactu\Logs\TransientLog;
use Stel\Verifactu\Repositories\IntegrationRepository;

class ImageService {
	private static ?ImageService $instance = null;
	private function __construct() {}
	public static function getInstance(): ImageService {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Dada una lista de URLs, importa las imágenes a la Media Library de WordPress
	 * y devuelve un array con los IDs de los attachments creados o encontrados.
	 * @param array $urls Lista de URLs de imágenes a importar
	 * @return int[] Lista de IDs de attachments correspondientes a las imágenes importadas
	 */
	public function importImageFromUrls( array $urls ): array {
		if ( empty( $urls ) ) {
			return [];
		}

		// Hacemos un distinct sobre las URLs
		$urls = array_values( array_unique( $urls ) );

		$attachmentIds = [];
		foreach ( $urls as $url ) {
			try {
				$result = $this->getOrCreateAttachmentIdFromUrl( $url );
				if ( is_wp_error( $result ) || $result === 0 ) {
					Logger::addLog([
						'type' => 'ImageService',
						'message' => "Error importing image from URL: $url. Error: " . ( is_wp_error( $result ) ? $result->get_error_message() : "Unknown error" ),
						'instance' => TransientLog::INSTANCE_ERROR
					]);
				} else {
					$attachmentIds[] = $result;
				}
			} catch ( \Throwable $e ) {
				Logger::addLog( [
					'type'          => 'ImageService',
					'error'       => get_class($e),
					'class_name'     => $e->getFile(),
					'message_error' => LogUtils::printThrowableTrace($e),
					'instance'    => TransientLog::INSTANCE_ERROR
				] );
			}
		}
		return $attachmentIds;
	}

	/**
	 * Devuelve el ID de un attachment existente si la URL ya fue importada,
	 * o crea uno nuevo descargándola.
	 */
	private function getOrCreateAttachmentIdFromUrl( string $url ): int|\WP_Error {
		$existingId = $this->findAttachmentIdBySourceUrl( $url );
		if ( $existingId ) {
			return $existingId;
		}
		return $this->createAttachmentFromUrl( $url );
	}

	private function decoratedDownloadUrl( string $url ): bool|string|\WP_Error {
		$filter = $this->getFilter($url);
		if (!isset($filter)) {
			return download_url($url);
		}

		add_filter( 'http_request_args', $filter, 10, 2 );
		$result = download_url( $url );
		remove_filter( 'http_request_args', $filter, 10, 2 );
		return $result;
	}

	/**
	 * Devuelve un callable que envuelve la función download_url de WordPress,
	 * para inyectar las cabeceras de autenticación
	 * @param string $url La URL de la imagen a descargar, se puede usar para decidir qué cabeceras inyectar
	 * @return callable(array, string):array|null
	 */
	private function getFilter( string $url ): callable|null {
		$integration = IntegrationRepository::getInstance()->get();
		if ( empty( $integration ) ) {
			return null;
		}
		return function ( $args, $request_url ) use ( $url, $integration ) {
			if ( wp_parse_url( $request_url, PHP_URL_HOST ) === wp_parse_url( $url, PHP_URL_HOST ) ) {
				$args['headers']['Authorization'] = 'Bearer ' . $integration->getToken();
			}
			return $args;
		};
	}



	/**
	 * Descarga la imagen desde la URL externa y la registra
	 * como attachment en la Media Library de WordPress.
	 */
	private function createAttachmentFromUrl( string $url): int|\WP_Error {

		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$tmpFile = $this->decoratedDownloadUrl( $url );
		if ( is_wp_error( $tmpFile ) ) {
			return $tmpFile;
		}
		$fileData = [
			'name' => $this->extractFileNameFromUrl( $url ),
			'tmp_name' => $tmpFile,
		];

		// Creamos el attachment sin post_parent, que posteriormente asignaremos al producto
		$attachmentId = media_handle_sideload( $fileData, 0 );
		// Si se ha producido un error, eliminamos el archivo temporal
		if ( is_wp_error( $attachmentId ) ) {
			if ( file_exists( $tmpFile ) ) {
                wp_delete_file( $tmpFile );
			}

			return $attachmentId;
		}
		// Asociamos la URL de origen al attachment para futuras referencias
		update_post_meta( $attachmentId, '_stel_verifactu_source_url', $url );
		return $attachmentId;
	}


	/**
	 * Busca en la Media Library un attachment que ya haya sido importado
	 * desde esta URL (guardamos la URL origen en meta para poder buscarlo).
	 */
	private function findAttachmentIdBySourceUrl( string $sourceUrl ): int {
		$args = [
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => [
				[
					'key'   => '_stel_verifactu_source_url',
					'value' => $sourceUrl,
				],
			],
		];

		$query = new \WP_Query( $args );
		if ( $query->have_posts() ) {
			return $query->posts[0];
		}

		return 0;
	}


	/**
	 * Extrae un nombre de archivo limpio desde la URL.
	 * Elimina query strings y fragmentos.
	 */
	private function extractFileNameFromUrl( string $url ): ?string {
		$parsed = wp_parse_url( $url );
		if ( empty( $parsed ) || !is_array( $parsed ) ) {
			return null;
		}

		$path = $parsed['path'] ?? '';
		$filename = basename( $path );

		if ( $filename === '' || $filename === '.' || $filename === '..' ) {
			$filename = "image-" . wp_generate_uuid4();
		}

		// Si la URL no tiene extensión reconocible, asignar una por defecto
		if ( ! preg_match( '/\.(jpg|jpeg|png|gif|webp)$/i', $filename ) ) {
			$filename .= '.jpg';
		}

		return sanitize_file_name( $filename );
	}
}