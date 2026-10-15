package com.finserv.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends BaseApiException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_RESOURCE");
    }

    public DuplicateResourceException(String message, String errorCode) {
        super(message, HttpStatus.CONFLICT, errorCode);
    }
}
