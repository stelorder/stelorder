<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Stel\Verifactu\Domain\InvoiceOrderDetails;
use Stel\Verifactu\Domain\InvoiceStatus;
use Stel\Verifactu\Exceptions\EntityNotFound;
use Stel\Verifactu\Repositories\InvoiceOrderDetailsRepository;

class InvoiceOrderDetailsService {
    
    private static ?InvoiceOrderDetailsService $instance = null;
    private InvoiceOrderDetailsRepository $repository;

    private function __construct() {
        $this->repository = InvoiceOrderDetailsRepository::getInstance();
    }

    public static function getInstance(): InvoiceOrderDetailsService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getInvoiceOrderDetails(int $orderId): InvoiceOrderDetails {
        if ($orderId <= 0) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        $result = $this->repository->getById($orderId);
        if (  !$result ) {
            throw new EntityNotFound("InvoiceOrderDetails not found for orderId: $orderId");
        }
        return $result;
    }

    public function updatePdfUrl(int $orderId, string $pdfUrl) {
        if ($orderId <= 0) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        if (empty($pdfUrl)) {
            throw new \InvalidArgumentException("Invalid pdfUrl: $pdfUrl");
        }

        $existingDetails = $this->repository->getById($orderId);

        if ($existingDetails === null) {
            $existingDetails = new InvoiceOrderDetails($orderId);
        }

        $existingDetails->setPdfUrl($pdfUrl);

        $this->repository->save($existingDetails);
    }

    public function updateSalesOrderPdfUrl(int $orderId, string $salesOrderPdfUrl) {
        if ($orderId <= 0) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }
        if (empty($salesOrderPdfUrl)) {
            throw new \InvalidArgumentException("Invalid salesOrderPdfUrl: $salesOrderPdfUrl");
        }

        $existingDetails = $this->repository->getById($orderId);

        if ($existingDetails === null) {
            $existingDetails = new InvoiceOrderDetails($orderId);
        }

        $existingDetails->setSalesOrderPdfUrl($salesOrderPdfUrl);

        $this->repository->save($existingDetails);
    }

    /**
     * @param int $orderId
     * @param \Stel\Verifactu\Domain\RefundDetails[] $refunds
     * @throws \InvalidArgumentException
     * @return void
     */
    public function addRefundDetails(int $orderId, array $refunds) {
        if ($orderId <= 0) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }

        $existingDetails = $this->repository->getById($orderId);

        if ($existingDetails === null) {
            $existingDetails = new InvoiceOrderDetails($orderId);
        }

        $existingDetails->addRefunds($refunds);

        $this->repository->save($existingDetails);
    }

    public function updateStatus(int $orderId, InvoiceStatus | null $status) {
        if ($orderId <= 0) {
            throw new \InvalidArgumentException("Invalid orderId: $orderId");
        }

        $existingDetails = $this->repository->getById($orderId);

        if ($existingDetails === null) {
            $existingDetails = new InvoiceOrderDetails($orderId);
        }

        $existingDetails->setStatus($status);

        $this->repository->save($existingDetails);
    }



}