package com.reda.retinascan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reda.retinascan.entity.Scan;
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

import java.io.IOException;
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

        try {
            System.out.println("Envoi vers IA : " + aiServiceUrl);

            ResponseEntity<String> response = restTemplate.postForEntity(aiServiceUrl, requestEntity, String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());

            if (root.has("diagnosis")) {
                prediction = root.path("diagnosis").asText();
                confidence = (float) root.path("confidence").asDouble();
            }
        } catch (Exception e) {
            System.err.println("ERREUR IA : " + e.getMessage());
        }

        String fakeImageUrl = "/uploads/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();

        Scan scan = Scan.builder()
                .imageUrl(fakeImageUrl)
                .aiPrediction(prediction)
                .aiConfidence(confidence)
                .symptoms(symptoms)
                .anamnesis(anamnesis)
                .consent(consent)
                .patient(patient)
                .build();

        return scanRepository.save(scan);
    }

    public List<Scan> getPatientHistory(User patient) {
        return scanRepository.findAllByPatientIdOrderByCreatedAtDesc(patient.getId());
    }
}