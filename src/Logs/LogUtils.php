<?php

namespace Stel\Verifactu\Logs;

class LogUtils {
	public static function printThrowableTrace(\Throwable $e): string {
		$output = "Exception " . get_class($e) . ":";
		$output .= $e->getMessage() . "\n";
		$output .= "at:\n" . explode("\n", $e->getTraceAsString())[0];

		$prev = $e->getPrevious();
		while ($prev !== null) {

			$output .= "Caused By " . get_class($prev) . ":";
			$output .= $prev->getMessage() . "\n";
			$output .= "at:\n" . explode("\n", $prev->getTraceAsString())[0];

			$prev = $prev->getPrevious();
		}

		return $output;
	}
}
