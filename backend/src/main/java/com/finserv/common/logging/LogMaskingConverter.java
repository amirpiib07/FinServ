package com.finserv.common.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Logback log masking converter that replaces sensitive fields (passwords, tokens, PAN, tax identifiers, cards)
 * with masked placeholders to prevent sensitive data leakage in logs.
 */
public class LogMaskingConverter extends MessageConverter {

    private static final Pattern SENSITIVE_JSON_PATTERN = Pattern.compile(
            "(?i)\"(password|password_hash|token|secret|jwt|tax_identifier|tax_identifier_encrypted|pan|aadhaar|pin)\"\\s*:\\s*\"([^\"]+)\""
    );

    private static final Pattern SENSITIVE_KV_PATTERN = Pattern.compile(
            "(?i)\\b(password|password_hash|token|secret|jwt|pan|aadhaar|pin)\\s*=\\s*([^\\s,;\\]}]+)"
    );

    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile(
            "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b"
    );

    @Override
    public String convert(ILoggingEvent event) {
        String message = super.convert(event);
        return mask(message);
    }

    public String mask(String message) {
        if (message == null || message.isEmpty()) {
            return message;
        }

        // 1. Mask JSON sensitive fields
        Matcher jsonMatcher = SENSITIVE_JSON_PATTERN.matcher(message);
        StringBuilder sb = new StringBuilder();
        while (jsonMatcher.find()) {
            String field = jsonMatcher.group(1);
            jsonMatcher.appendReplacement(sb, "\"" + Matcher.quoteReplacement(field) + "\":\"***MASKED***\"");
        }
        jsonMatcher.appendTail(sb);
        String intermediate = sb.toString();

        // 2. Mask Key=Value sensitive fields
        Matcher kvMatcher = SENSITIVE_KV_PATTERN.matcher(intermediate);
        sb = new StringBuilder();
        while (kvMatcher.find()) {
            String field = kvMatcher.group(1);
            kvMatcher.appendReplacement(sb, Matcher.quoteReplacement(field) + "=***MASKED***");
        }
        kvMatcher.appendTail(sb);
        intermediate = sb.toString();

        // 3. Mask credit card sequences
        return CREDIT_CARD_PATTERN.matcher(intermediate).replaceAll("****-****-****-****");
    }
}
