<?php

namespace Stel\Verifactu\Controllers\Utils;

class ArrayUtils {
    private function __construct() {}

    /** Summary of findIndexOf
     * @template T of object
     * @param T[] $array The array to search through.
     * @param callable(T): bool $predicate A callable that takes an element of the array and returns true if it matches the condition.
     * @return int The index of the first element that matches the predicate, or -1 if no match is found.
     */
    public static function findIndexOf(array $array, callable $predicate): int {
        foreach ($array as $index => $element) {
            if ($predicate($element)) {
                return $index;
            }
        }
        return -1; // Return -1 if no element matches the predicate
    }
}