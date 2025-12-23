package com.reda.retinascan.controller;

import com.reda.retinascan.entity.Scan;
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

    @PostMapping("/upload")
    public ResponseEntity<Scan> uploadScan(
            @RequestParam("file") MultipartFile file,
            @RequestParam("symptoms") String symptoms,
            Principal principal
    ) throws IOException {
        return ResponseEntity.ok(scanService.saveScan(principal.getName(), file, symptoms));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Scan>> getHistory(Principal principal) {
        return ResponseEntity.ok(scanService.getUserHistory(principal.getName()));
    }
}