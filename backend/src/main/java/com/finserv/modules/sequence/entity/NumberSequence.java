package com.finserv.modules.sequence.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "number_sequences")
public class NumberSequence {

    @Id
    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Column(name = "current_value", nullable = false)
    private Long currentValue = 0L;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public NumberSequence() {
    }

    public NumberSequence(String name, Long currentValue) {
        this.name = name;
        this.currentValue = currentValue;
        this.updatedAt = Instant.now();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(Long currentValue) {
        this.currentValue = currentValue;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
