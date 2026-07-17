<?php

namespace Stel\Verifactu\Domain;

class InvoiceOrderDetails {
   private int $externalId;
   /**
    * Invoice pdf Url
    * @var string
    */
   private string $pdfUrl;
   private string $salesOrderPdfUrl;
   /** @var RefundDetails[] */
   private array $refunds;
   private InvoiceStatus | null $status;

   /**
    * @param int $externalId
    * @param string $pdfUrl
    * @param RefundDetails[] $refunds
    * @param InvoiceStatus $status
    */
   public function __construct(int $externalId, string $pdfUrl = '', array $refunds = array(), $status = null, string $salesOrderPdfUrl = '') {
      if (!Utils::checkIsPositiveInt($externalId)) {
         throw new \InvalidArgumentException('External ID must be a positive integer.');
      }
      if (!empty($pdfUrl) && !filter_var($pdfUrl, FILTER_VALIDATE_URL)) {
         throw new \InvalidArgumentException('PDF URL must be a valid URL.');
      }
      if (!empty($salesOrderPdfUrl) && !filter_var($salesOrderPdfUrl, FILTER_VALIDATE_URL)) {
         throw new \InvalidArgumentException('Sales Order PDF URL must be a valid URL.');
      }
      if (isset($status) && !($status instanceof InvoiceStatus)) {
         throw new \InvalidArgumentException('Status must be an instance of InvoiceStatus or null.');

      }
      foreach ($refunds as $refund) {
         if (!($refund instanceof RefundDetails)) {
            throw new \InvalidArgumentException('Each refund must be an instance of RefundDetails.');
         }
         
      }


      $this->externalId = $externalId;
      $this->pdfUrl = $pdfUrl;
      $this->refunds = $refunds;
      $this->status = $status;
      $this->salesOrderPdfUrl = $salesOrderPdfUrl;
   }

   public function getExternalId(): int {
      return $this->externalId;
   }

   public function getPdfUrl(): string {
      return $this->pdfUrl;
   }

   public function setPdfUrl(string $pdfUrl) {
      if (!empty($pdfUrl) && !filter_var($pdfUrl, FILTER_VALIDATE_URL)) {
         throw new \InvalidArgumentException('PDF URL must be a valid URL.');
      }
      $this->pdfUrl = $pdfUrl;
   }

   public function getSalesOrderPdfUrl(): string {
      return $this->salesOrderPdfUrl;
   }

   public function setSalesOrderPdfUrl(string $salesOrderPdfUrl) {
      if (!empty($salesOrderPdfUrl) && !filter_var($salesOrderPdfUrl, FILTER_VALIDATE_URL)) {
         throw new \InvalidArgumentException('Sales Order PDF URL must be a valid URL.');
      }
      $this->salesOrderPdfUrl = $salesOrderPdfUrl;
   }

   public function getRefunds(): array {
      return $this->refunds;
   }

   /**
    * @param RefundDetails[] $refunds
    * @throws \InvalidArgumentException
    * @return void
    */
   public function addRefunds(array $refunds) {
      foreach ($refunds as $refund) {
         if (!($refund instanceof RefundDetails)) {
            throw new \InvalidArgumentException('Each refund must be an instance of RefundDetails.');
         }
         $this->refunds[] = $refund;
      }
   }

   public function getStatus(): InvoiceStatus | null {
      return $this->status;
   }

   public function setStatus(InvoiceStatus | null $status = null) {
      if ($status && !($status instanceof InvoiceStatus)) {
         throw new \InvalidArgumentException('Status must be an instance of InvoiceStatus or null.');
      }
      $this->status = $status;
   }


}