package com.ecomatch.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class WasteDetectionService {

    private final RestTemplate restTemplate;

    @Value("${waste.detection.server.url:http://localhost:8000}")
    private String wasteDetectionServerUrl;

    @Value("${waste.detection.output.dir:/Users/dakshrathore/Downloads/Ecomatch-main/model/outputs/outputs}")
    private String outputDir;

    public WasteDetectionService() {
        this.restTemplate = new RestTemplate();
    }

    private boolean isModelServerRunning() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(wasteDetectionServerUrl + "/health", String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.error("Error checking if model server is running: {}", e.getMessage());
            return false;
        }
    }

    public String detectWaste(MultipartFile imageFile) throws IOException {
        log.info("Sending image to waste detection server: {}", imageFile.getOriginalFilename());

        if (!isModelServerRunning()) {
            log.error("Waste detection model server is not running at {}", wasteDetectionServerUrl);
            throw new IOException("Waste detection model server is not running. Please start the model server and try again.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return imageFile.getOriginalFilename();
            }
        };

        body.add("file", resource);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    wasteDetectionServerUrl + "/detect",
                    HttpMethod.POST,
                    requestEntity,
                    byte[].class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("Successfully received waste detection results");
                byte[] responseBody = response.getBody();
                if (responseBody == null || responseBody.length == 0) {
                    log.warn("Received empty response body from waste detection server");
                    throw new IOException("Received empty response from waste detection server");
                }

                File directory = new File(outputDir);
                if (!directory.exists() && !directory.mkdirs()) {
                    throw new IOException("Failed to create output directory: " + outputDir);
                }

                String outputFilePath = outputDir + File.separator + "processed_" + imageFile.getOriginalFilename();
                try (FileOutputStream fos = new FileOutputStream(outputFilePath)) {
                    fos.write(responseBody);
                }

                log.info("Processed image saved at: {}", outputFilePath);
                return outputFilePath;
            } else {
                log.error("Error detecting waste: {}", response.getStatusCode());
                throw new IOException("Error detecting waste: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Exception while detecting waste: {}", e.getMessage(), e);
            throw new IOException("Error detecting waste: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getWasteDetectionData(MultipartFile imageFile) throws IOException {
        log.info("Getting waste detection data for image: {}", imageFile.getOriginalFilename());

        if (!isModelServerRunning()) {
            log.error("Waste detection model server is not running at {}", wasteDetectionServerUrl);
            throw new IOException("Waste detection model server is not running. Please start the model server and try again.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return imageFile.getOriginalFilename();
            }
        };

        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    wasteDetectionServerUrl + "/detect-json",
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("Successfully received waste detection data");
                Map<String, Object> responseBody = response.getBody();
                if (responseBody == null) {
                    log.warn("Received null response body from waste detection server");
                    return Map.of("status", "error", "error", "Received null response from waste detection server");
                }
                log.debug("Response body: {}", responseBody);
                return responseBody;
            } else {
                log.error("Error getting waste detection data: {}", response.getStatusCode());
                throw new IOException("Error getting waste detection data: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Exception while getting waste detection data: {}", e.getMessage(), e);
            throw new IOException("Error getting waste detection data: " + e.getMessage(), e);
        }
    }
}