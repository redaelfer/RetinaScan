package com.reda.retinascan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reda.retinascan.entity.Scan;
import com.reda.retinascan.entity.ScanStatus;
import com.reda.retinascan.entity.User;
import com.reda.retinascan.repository.ScanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Comparator;
import java.util.stream.Collectors;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScanService {

    private final ScanRepository scanRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${AI_SERVICE_URL:http://localhost:5000/predict}")
    private String aiServiceUrl;

    public Scan processScan(MultipartFile file, User patient, String symptoms, String anamnesis, boolean consent) throws IOException {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        String prediction = "Non Analysé (Erreur IA)";
        float confidence = 0.0f;
        String detailsJson = "{}";

        try {
            System.out.println("Envoi vers IA : " + aiServiceUrl);

            ResponseEntity<String> response = restTemplate.postForEntity(aiServiceUrl, requestEntity, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());

            if (root.has("diagnosis")) {
                prediction = root.path("diagnosis").asText();
                confidence = (float) root.path("confidence").asDouble();
                if (root.has("details")) {
                    detailsJson = root.path("details").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("ERREUR IA : " + e.getMessage());
        }

        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String fakeImageUrl = "/uploads/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();

        Scan scan = Scan.builder()
                .imageUrl(fakeImageUrl)
                .imageData(base64Image)
                .aiPrediction(prediction)
                .aiConfidence(confidence)
                .aiDetails(detailsJson)
                .symptoms(symptoms)
                .anamnesis(anamnesis)
                .consent(consent)
                .patient(patient)
                .status(ScanStatus.PENDING)
                .build();

        return scanRepository.save(scan);
    }

    public Scan validateScan(Long scanId, String notes) {
        Scan scan = scanRepository.findById(scanId)
                .orElseThrow(() -> new RuntimeException("Scan non trouvé"));

        scan.setStatus(ScanStatus.VALIDATED);
        scan.setDoctorNotes(notes);

        System.out.println(">>> NOTIFICATION ENVOYÉE AU PATIENT : " + scan.getPatient().getEmail());
        System.out.println(">>> RAPPORT GÉNÉRÉ : Diagnostic validé par le médecin.");

        return scanRepository.save(scan);
    }

    public List<Scan> getPatientHistory(User patient) {
        return scanRepository.findAllByPatientIdOrderByCreatedAtDesc(patient.getId());
    }

    public List<Scan> getDoctorQueue() {
        List<Scan> allScans = scanRepository.findAll();
        return allScans.stream()
                .filter(s -> s.getStatus() == ScanStatus.PENDING)
                .sorted(Comparator.comparingInt(this::getSeverityScore))
                .collect(Collectors.toList());
    }

    private int getSeverityScore(Scan scan) {
        String pred = scan.getAiPrediction();
        if (pred == null) return 10;
        if (pred.contains("Proliférante")) return 1;
        if (pred.contains("Sévère")) return 2;
        if (pred.contains("Modérée")) return 3;
        if (pred.contains("Légère")) return 4;
        if (pred.contains("Sain")) return 5;
        return 10;
    }

    public com.reda.retinascan.dto.StatsResponse getGlobalStats() {
        List<Scan> allScans = scanRepository.findAll();

        java.util.Map<String, Long> severityDist = allScans.stream()
                .map(s -> s.getAiPrediction() != null ? s.getAiPrediction() : "Non Analysé")
                .collect(Collectors.groupingBy(java.util.function.Function.identity(), Collectors.counting()));

        java.util.Map<String, Long> symptomDist = new java.util.HashMap<>();
        allScans.forEach(scan -> {
            if (scan.getSymptoms() != null) {
                String txt = scan.getSymptoms().toLowerCase();
                if (txt.contains("flou")) symptomDist.merge("Vision Floue", 1L, Long::sum);
                else if (txt.contains("tache")) symptomDist.merge("Taches", 1L, Long::sum);
                else if (txt.contains("douleur")) symptomDist.merge("Douleur", 1L, Long::sum);
                else if (txt.contains("diabete")) symptomDist.merge("Diabète", 1L, Long::sum);
                else if (txt.contains("noir")) symptomDist.merge("Points Noirs", 1L, Long::sum);
                else symptomDist.merge("Autres", 1L, Long::sum);
            }
        });

        List<User> uniquePatients = allScans.stream()
                .map(Scan::getPatient)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        long urgentCount = allScans.stream()
                .filter(s -> s.getAiPrediction() != null &&
                        (s.getAiPrediction().contains("Sévère") || s.getAiPrediction().contains("Proliférante")))
                .count();

        long pendingCount = allScans.stream()
                .filter(s -> s.getStatus() == com.reda.retinascan.entity.ScanStatus.PENDING)
                .count();

        double avgConf = allScans.stream()
                .filter(s -> s.getAiConfidence() != null)
                .mapToDouble(Scan::getAiConfidence)
                .average().orElse(0.0);

        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.Map<String, Long> last7Days = new java.util.LinkedHashMap<>();

        for (int i = 6; i >= 0; i--) {
            last7Days.put(today.minusDays(i).toString(), 0L);
        }

        for (Scan s : allScans) {
            String dateKey = s.getCreatedAt().toLocalDate().toString();
            if (last7Days.containsKey(dateKey)) {
                last7Days.put(dateKey, last7Days.get(dateKey) + 1);
            }
        }

        return com.reda.retinascan.dto.StatsResponse.builder()
                .severityDistribution(severityDist)
                .symptomsFrequency(symptomDist)
                .patients(uniquePatients)
                .totalScans(allScans.size())
                .urgentCases(urgentCount)
                .pendingCases(pendingCount)
                .avgConfidence(Math.round(avgConf * 100.0) / 100.0)
                .scansLast7Days(last7Days)
                .build();
    }
}