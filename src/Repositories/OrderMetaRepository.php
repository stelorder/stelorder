<?php

namespace Stel\Verifactu\Repositories;

interface OrderMetaRepository {

    public static function getInstance(): WCDataRepository;

    /**
     * This function retrieves the meta value for a given order ID and meta key.
     * @param int $orderId id of the order
     * @param string $metaKey name of the meta key
     * @param mixed $single whether to return a single value or an array with all values
     * @return mixed
     */
    public function getMeta($orderId, $metaKey, $single = true): mixed;

    /**
     * This function updates the meta value for a given order ID and meta key.
     * @param int $orderId id of the order
     * @param string $metaKey name of the meta key
     * @param mixed $metaValue value to set
     * @return void
     */
    public function updateMeta($orderId, $metaKey, $metaValue);

    /**
     * This function deletes the meta value for a given order ID and meta key.
     * @param int $orderId id of the order
     * @param string $metaKey name of the meta key
     * @return void
     */
    public function deleteMeta($orderId, $metaKey);
}