package com.finserv.common.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends BaseApiException {

    public ValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED");
    }

    public ValidationException(String message, String errorCode) {
        super(message, HttpStatus.BAD_REQUEST, errorCode);
    }
}
