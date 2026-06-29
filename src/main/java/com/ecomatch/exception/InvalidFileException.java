package com.ecomatch.exception;

/**
 * Exception thrown when an uploaded file is invalid (wrong type, empty, etc.)
 */
public class InvalidFileException extends RuntimeException {
    
    public InvalidFileException(String message) {
        super(message);
    }
    
    public InvalidFileException(String message, Throwable cause) {
        super(message, cause);
    }
}