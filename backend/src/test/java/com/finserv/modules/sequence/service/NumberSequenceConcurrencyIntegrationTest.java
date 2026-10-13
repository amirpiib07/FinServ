package com.finserv.modules.sequence.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NumberSequenceConcurrencyIntegrationTest {

    @Autowired
    private NumberSequenceService numberSequenceService;

    @Test
    @DisplayName("Should guarantee zero duplicate sequence values under heavy concurrent thread execution")
    void shouldGuaranteeZeroDuplicatesUnderConcurrency() throws InterruptedException {
        int threadCount = 10;
        int incrementsPerThread = 20;
        int totalIncrements = threadCount * incrementsPerThread;

        Set<Long> generatedValues = Collections.synchronizedSet(new HashSet<>());
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        for (int t = 0; t < threadCount; t++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    for (int i = 0; i < incrementsPerThread; i++) {
                        long val = numberSequenceService.getNextValue("account_num_seq");
                        generatedValues.add(val);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Fire all threads simultaneously
        startLatch.countDown();
        boolean completed = finishLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(generatedValues).hasSize(totalIncrements);
    }
}
