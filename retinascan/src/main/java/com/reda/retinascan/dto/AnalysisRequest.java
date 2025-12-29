package com.reda.retinascan.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AnalysisRequest {
    private String patientName;
    private ScanInfo current;
    private List<ScanInfo> history;

    @Data
    @Builder
    public static class ScanInfo {
        private String date;
        private int severity_level;
        private String prediction;
        private double confidence;
        private String symptoms;
    }
}