package com.finserv.common.util;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;

import java.util.UUID;

/**
 * Utility for generating RFC 9562 standard UUIDv7 sequential identifiers.
 * High-throughput financial and ledger tables use UUIDv7 to optimize B-Tree clustering.
 */
public final class UuidUtils {

    private static final TimeBasedEpochGenerator UUID_V7_GENERATOR = Generators.timeBasedEpochGenerator();

    private UuidUtils() {
    }

    /**
     * Generates a time-ordered UUIDv7.
     */
    public static UUID generateV7() {
        return UUID_V7_GENERATOR.generate();
    }

    /**
     * Generates a random UUIDv4.
     */
    public static UUID generateV4() {
        return UUID.randomUUID();
    }
}
