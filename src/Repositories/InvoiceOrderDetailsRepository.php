<?php

namespace Stel\Verifactu\Repositories;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Domain\InvoiceStatus;
use Stel\Verifactu\Domain\RefundDetails;
use Stel\Verifactu\Services\OrderMetaService;

class InvoiceOrderDetailsRepository {
    private static ?InvoiceOrderDetailsRepository $instance = null;

    private OrderMetaService $orderMetaService;

    public static function getInstance(?OrderMetaService $service = null): InvoiceOrderDetailsRepository {
        if (self::$instance === null) {
            self::$instance = new InvoiceOrderDetailsRepository($service);
        }
        return self::$instance;
    }

    private function __construct(?OrderMetaService $service = null) {
        $this->orderMetaService = $service ?? OrderMetaService::getInstance(OrderMetaRepositoryImpl::getInstance());
    }

    public function getById(int $orderId): InvoiceOrderDetails | null {
        $result = $this->orderMetaService->getMetaByOrderId($orderId, 'invoice_meta');
        if (!isset($result) || empty($result)) {
            return null;
        }
        return new InvoiceOrderDetails($orderId, $result['pdfUrl'] ?? '', 
        array_map(function (array $refund) {
            if (!is_array($refund)) {
                throw new \InvalidArgumentException('Each refund must be an array representing RefundDetails.');
            }
            return new RefundDetails($refund['externalId'] ?? 0, $refund['pdfUrl'] ?? '', $refund['createdDate'] ?? '');
        }, $result['refunds'] ?? []), InvoiceStatus::tryFrom($result['status'] ?? ''),
            $result['salesOrderPdfUrl'] ?? ''
        );
    }

    public function save(InvoiceOrderDetails $details): void {
        $data = [
            'pdfUrl' => $details->getPdfUrl(),
            'salesOrderPdfUrl' => $details->getSalesOrderPdfUrl(),
            'refunds' => array_map(function (RefundDetails $refund) {
                return [
                    'externalId' => $refund->getExternalId(),
                    'pdfUrl' => $refund->getPdfUrl(),
                    'createdDate' => $refund->getCreatedDate(),
                ];
            }, $details->getRefunds()),
            'status' => $details->getStatus() ? $details->getStatus()->value : null,
        ];
        $this->orderMetaService->updateMetaByOrderId($details->getExternalId(), 'invoice_meta', $data);
    }


}