package com.ecomatch.exception;

/**
 * Exception thrown when there's an issue with waste detection processing
 */
public class WasteDetectionException extends RuntimeException {
    
    public WasteDetectionException(String message) {
        super(message);
    }
    
    public WasteDetectionException(String message, Throwable cause) {
        super(message, cause);
    }
}