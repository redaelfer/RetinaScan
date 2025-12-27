package com.reda.retinascan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "examinations")
public class Scan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String imageData;

    private String imageUrl;

    private String aiPrediction;
    private Float aiConfidence;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String anamnesis;

    private boolean consent;

    @Enumerated(EnumType.STRING)
    private ScanStatus status;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private User patient;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ScanStatus.PENDING;
    }
}

enum ScanStatus {
    PENDING,
    VALIDATED,
    ARCHIVED
}