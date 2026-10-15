package com.finserv.common.util;

import java.util.regex.Pattern;

public final class LogMaskingUtils {

    private static final Pattern TAX_ID_PATTERN = Pattern.compile("(?i)(tax_?identifier|tax_?id|pan|ssn)[\"']?\\s*[:=]\\s*[\"']?([A-Z0-9]{4,})[\"']?");
    private static final Pattern CARD_PATTERN = Pattern.compile("\\b(?:\\d{4}[ -]?){3}(\\d{4})\\b");

    private LogMaskingUtils() {
    }

    /**
     * Masks sensitive credit card or account digits, revealing only the last 4 characters.
     */
    public static String maskLastFour(String value) {
        if (value == null || value.length() <= 4) {
            return "****";
        }
        return "*".repeat(value.length() - 4) + value.substring(value.length() - 4);
    }

    /**
     * Masks any sensitive pattern inside arbitrary log message strings.
     */
    public static String maskSensitiveData(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        String masked = CARD_PATTERN.matcher(input).replaceAll("****-****-****-$1");
        masked = TAX_ID_PATTERN.matcher(masked).replaceAll("$1: \"***MASKED***\"");
        return masked;
    }
}
