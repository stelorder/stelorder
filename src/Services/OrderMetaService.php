<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Stel\Verifactu\Repositories\OrderMetaRepository;

class OrderMetaService {
    private static ?OrderMetaService $instance = null;
    private OrderMetaRepository $orderMetaRepository;

    private function __construct(OrderMetaRepository $orderMetaRepository) {
        $this->orderMetaRepository = $orderMetaRepository;
    }

    private function isValidMetaKey(string $metaKey) {
        return !empty(trim($metaKey));
    }

    private function isValidOrderId(int $orderId) {
        return $orderId > 0;
    }


    public static function getInstance(OrderMetaRepository $orderMetaRepository): OrderMetaService {
        if (self::$instance === null) {
            self::$instance = new self($orderMetaRepository);
        }
        return self::$instance;
    }

    public function getMetaByOrderId(int $orderId, string $metaKey): mixed {
        if (!$this->isValidOrderId($orderId)) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        if (!$this->isValidMetaKey($metaKey)) {
            throw new \InvalidArgumentException("Invalid metaKey: $metaKey");
        }
        return $this->orderMetaRepository->getMeta($orderId, $metaKey);
    }

    public function updateMetaByOrderId(int $orderId, string $metaKey, $metaValue): void {
        if (!$this->isValidOrderId($orderId)) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        if (!$this->isValidMetaKey($metaKey)) {
            throw new \InvalidArgumentException("Invalid metaKey: $metaKey");
        }
        $this->orderMetaRepository->updateMeta($orderId, $metaKey, $metaValue);
    }

    public function deleteMetaByOrderId(int $orderId, string $metaKey): void {
        if (!$this->isValidOrderId($orderId)) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        if (!$this->isValidMetaKey($metaKey)) {
            throw new \InvalidArgumentException("Invalid metaKey: $metaKey");
        }
        $this->orderMetaRepository->deleteMeta($orderId, $metaKey);
    }
}