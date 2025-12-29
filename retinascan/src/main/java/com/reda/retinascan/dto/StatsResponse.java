package com.reda.retinascan.dto;

import com.reda.retinascan.entity.User;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class StatsResponse {
    private Map<String, Long> severityDistribution;
    private Map<String, Long> symptomsFrequency;
    private List<User> patients;
    private long totalScans;
    private long urgentCases;
    private long pendingCases;
    private double avgConfidence;
    private Map<String, Long> scansLast7Days;
}