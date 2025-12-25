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

    private String diagnosisCorrection;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private User doctor;

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