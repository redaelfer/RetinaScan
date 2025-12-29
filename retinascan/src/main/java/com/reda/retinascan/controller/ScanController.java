package com.reda.retinascan.controller;

import com.reda.retinascan.entity.Scan;
import com.reda.retinascan.entity.User;
import com.reda.retinascan.repository.UserRepository;
import com.reda.retinascan.service.ScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/scans")
@RequiredArgsConstructor
public class ScanController {

    private final ScanService scanService;
    private final UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<Scan> uploadScan(
            @RequestParam("file") MultipartFile file,
            @RequestParam("symptoms") String symptoms,
            @RequestParam("anamnesis") String anamnesis,
            @RequestParam("consent") boolean consent,
            Principal principal
    ) throws IOException {

        String email = principal.getName();

        User patient = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        Scan savedScan = scanService.processScan(file, patient, symptoms, anamnesis, consent);

        return ResponseEntity.ok(savedScan);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Scan>> getHistory(Principal principal) {
        String email = principal.getName();
        User patient = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        return ResponseEntity.ok(scanService.getPatientHistory(patient));
    }

    @GetMapping("/doctor-queue")
    public ResponseEntity<List<Scan>> getDoctorQueue() {
        return ResponseEntity.ok(scanService.getDoctorQueue());
    }

    @GetMapping("/patient/{patientId}/history")
    public ResponseEntity<List<Scan>> getPatientHistoryForDoctor(@PathVariable Long patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        return ResponseEntity.ok(scanService.getPatientHistory(patient));
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<Scan> validateScan(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload
    ) {
        String notes = payload.get("notes");
        return ResponseEntity.ok(scanService.validateScan(id, notes));
    }

    @GetMapping("/stats")
    public ResponseEntity<com.reda.retinascan.dto.StatsResponse> getStats() {
        return ResponseEntity.ok(scanService.getGlobalStats());
    }
}