package com.finserv.common.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BaseApiException {

    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT, "RESOURCE_CONFLICT");
    }

    public ConflictException(String message, String errorCode) {
        super(message, HttpStatus.CONFLICT, errorCode);
    }
}
