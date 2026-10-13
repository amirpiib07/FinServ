package com.finserv.common.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ErrorResponse {

    private boolean success = false;
    private Instant timestamp;
    private int status;
    private String errorCode;
    private String message;
    private String path;
    private String correlationId;
    private List<ValidationError> validationErrors;

    public ErrorResponse() {
        this.timestamp = Instant.now();
        this.validationErrors = new ArrayList<>();
    }

    public ErrorResponse(int status, String errorCode, String message, String path, String correlationId) {
        this.success = false;
        this.timestamp = Instant.now();
        this.status = status;
        this.errorCode = errorCode;
        this.message = message;
        this.path = path;
        this.correlationId = correlationId;
        this.validationErrors = new ArrayList<>();
    }

    public static class ValidationError {
        private String field;
        private String message;

        public ValidationError() {
        }

        public ValidationError(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public List<ValidationError> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(List<ValidationError> validationErrors) {
        this.validationErrors = validationErrors;
    }

    public void addValidationError(String field, String message) {
        this.validationErrors.add(new ValidationError(field, message));
    }
}
