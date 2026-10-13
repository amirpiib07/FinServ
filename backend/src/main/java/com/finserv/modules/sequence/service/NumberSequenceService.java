package com.finserv.modules.sequence.service;

import com.finserv.modules.sequence.entity.NumberSequence;
import com.finserv.modules.sequence.repository.NumberSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class NumberSequenceService {

    private final NumberSequenceRepository sequenceRepository;

    public NumberSequenceService(NumberSequenceRepository sequenceRepository) {
        this.sequenceRepository = sequenceRepository;
    }

    /**
     * Atomically retrieves and increments the sequence counter under a PESSIMISTIC_WRITE row lock.
     * Annual customer sequences (customer_cif_seq_YYYY) are instantiated lazily if absent.
     *
     * @param sequenceName the name of the sequence
     * @return the newly incremented sequence value
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public long getNextValue(String sequenceName) {
        Optional<NumberSequence> sequenceOpt = sequenceRepository.findByNameWithLock(sequenceName);

        NumberSequence sequence;
        if (sequenceOpt.isPresent()) {
            sequence = sequenceOpt.get();
        } else if (sequenceName.startsWith("customer_cif_seq_")) {
            // Lazy initialization for annual customer sequence
            NumberSequence newSeq = new NumberSequence(sequenceName, 0L);
            sequence = sequenceRepository.saveAndFlush(newSeq);
            // Re-acquire lock to ensure deterministic concurrency
            sequence = sequenceRepository.findByNameWithLock(sequenceName).orElse(sequence);
        } else {
            throw new IllegalArgumentException("Unknown number sequence: " + sequenceName);
        }

        long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        sequence.setUpdatedAt(Instant.now());
        sequenceRepository.save(sequence);

        return nextVal;
    }
}
