package com.reda.retinascan.service;

import com.reda.retinascan.entity.Scan;
import com.reda.retinascan.entity.User;
import com.reda.retinascan.repository.ScanRepository;
import com.reda.retinascan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import java.util.Map;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScanService {

    private final ScanRepository scanRepository;
    private final UserRepository userRepository;
    private final String UPLOAD_DIR = "uploads/";
    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_SERVICE_URL = "http://localhost:5000/predict";

    public Scan saveScan(String userEmail, MultipartFile file, String symptoms) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        String aiDiagnosis = "Pending Analysis";
        Float confidence = 0.0f;

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(filePath.toFile()));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(AI_SERVICE_URL, requestEntity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                aiDiagnosis = (String) result.get("diagnosis");
                confidence = ((Number) result.get("confidence")).floatValue();
            }
        } catch (Exception e) {
            e.printStackTrace();
            aiDiagnosis = "AI Service Unavailable";
        }

        Scan scan = Scan.builder()
                .user(user)
                .imageUrl(filePath.toString())
                .symptoms(symptoms)
                .diagnosis(aiDiagnosis)
                .confidence(confidence)
                .build();

        return scanRepository.save(scan);
    }

    public List<Scan> getUserHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return scanRepository.findByUserId(user.getId());
    }


}