package com.finserv.common.exception;

import com.finserv.common.dto.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Should map ResourceNotFoundException to 404 ErrorResponse")
    void shouldMapResourceNotFoundException() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/accounts/12345");
        ResourceNotFoundException ex = new ResourceNotFoundException("Account", "id", "12345");

        ResponseEntity<ErrorResponse> response = handler.handleBaseApiException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getErrorCode()).isEqualTo("RESOURCE_NOT_FOUND");
        assertThat(response.getBody().getPath()).isEqualTo("/api/v1/accounts/12345");
        assertThat(response.getBody().getCorrelationId()).isNotBlank();
    }

    @Test
    @DisplayName("Should map ConflictException to 409 ErrorResponse")
    void shouldMapConflictException() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/users");
        ConflictException ex = new ConflictException("User already exists", "DUPLICATE_USER");

        ResponseEntity<ErrorResponse> response = handler.handleBaseApiException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getErrorCode()).isEqualTo("DUPLICATE_USER");
    }

    @Test
    @DisplayName("Should map generic unexpected exception to 500 without leaking stack traces")
    void shouldMapGenericExceptionWithoutLeakingStackTrace() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/internal");
        NullPointerException ex = new NullPointerException("Null reference inside internal logic");

        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(response.getBody().getMessage()).doesNotContain("NullPointerException");
        assertThat(response.getBody().getMessage()).contains("correlationId");
    }
}
