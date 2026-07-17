<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Repositories;

use Stel\Verifactu\Exceptions\EntityNotFound;

class OrderMetaRepositoryImpl extends WCDataRepository implements OrderMetaRepository{
    protected function getResourceClass(): string {
        return 'WC_Order';
    }

    public function getMeta($orderId, $metaKey, $single = true): mixed {
        /**
         * @var \WC_Order $order obtained order object
         */
        $order = $this->findById($orderId);
        if ($order) {
            return $order->get_meta($metaKey, $single);
        }

        throw new EntityNotFound("Order with id $orderId not found");

    }

    public function updateMeta($orderId, $metaKey, $metaValue) {
        /**
         * @var \WC_Order $order obtained order object
         */
        $order = $this->findById($orderId);
        if ($order) {
            $order->update_meta_data($metaKey, $metaValue);
            $this->setSuppressWebhooks(true);
            try {
                $order->save();
            } finally {
                $this->setSuppressWebhooks(false);
            }
            return;
        }
        
        throw new EntityNotFound("Order with id $orderId not found");
    }

    public function deleteMeta($orderId, $metaKey) {
        /**
         * @var \WC_Order $order obtained order object
         */
        $order = $this->findById($orderId);
        if ($order) {
            $order->delete_meta_data($metaKey);
            $this->setSuppressWebhooks(true);
            try {
                $order->save();
            } finally {
                $this->setSuppressWebhooks(false);
            }
            return;
        }
        throw new EntityNotFound("Order with id $orderId not found");
    }
}