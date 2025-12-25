package com.reda.retinascan.repository;

import com.reda.retinascan.entity.Scan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScanRepository extends JpaRepository<Scan, Long> {
    List<Scan> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Scan> findByStatus(String status);

    List<Scan> findAllByPatientIdOrderByCreatedAtDesc(Long patientId);
}