package com.finserv.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenOperationException extends BaseApiException {

    public ForbiddenOperationException(String message) {
        super(message, HttpStatus.FORBIDDEN, "OPERATION_FORBIDDEN");
    }
}
