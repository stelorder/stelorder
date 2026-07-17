<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Services;

use Exception;
use Stel\Verifactu\Repositories\CustomerRepository;

class CustomerService {
    private static ?CustomerService $instance = null; // Instancia única de la clase
    private CustomerRepository $customerRepository;
    // Constructor privado para evitar la instanciación directa
    private function __construct() {
        $this->customerRepository = CustomerRepository::getInstance();
    }

    // Método para obtener la instancia única
    public static function getInstance(): CustomerService {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getCustomerById(string $customerId) {
        $customer = $this->customerRepository->findById($customerId);
        if (!$customer || !$customer->get_id()) {
            throw new Exception("Customer with ID $customerId not found");
        }
        return $customer;
    }
}