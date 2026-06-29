package com.ecomatch.controller;

import com.ecomatch.service.WasteDetectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Controller for waste detection functionality
 */
@RestController
@RequestMapping("/api/waste-detection")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
@Slf4j
public class WasteDetectionController {

    private final WasteDetectionService wasteDetectionService;

    @Autowired
    public WasteDetectionController(WasteDetectionService wasteDetectionService) {
        this.wasteDetectionService = wasteDetectionService;
    }

    /**
     * Detect waste objects in an uploaded image and return the processed image
     * 
     * @param file The image file to analyze
     * @return The processed image with waste objects detected
     */
    @PostMapping("/detect")
    public ResponseEntity<Map<String, Object>> detectWaste(@RequestParam("file") MultipartFile file) {
        log.info("Received waste detection request for file: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            log.warn("Empty file uploaded");
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Please upload a non-empty image file"
            ));
        }

        try {
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Please upload an image file"
                ));
            }

            // Process the image through the waste detection service
            String processedImagePath = wasteDetectionService.detectWaste(file);

            // Return the file path in the response
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Waste detection completed successfully",
                    "processedImagePath", processedImagePath
            ));

        } catch (IOException e) {
            log.error("Error processing waste detection: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Error processing waste detection",
                    "details", e.getMessage()
            ));
        }
    }
    /**
     * Get detailed information about waste objects in an uploaded image
     * 
     * @param file The image file to analyze
     * @return JSON data with waste detection results
     */
    @PostMapping("/detect-data")
    public ResponseEntity<?> getWasteDetectionData(@RequestParam("file") MultipartFile file) {
        log.info("Received waste detection data request for file: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            log.warn("Empty file uploaded");
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "error", "Please upload a non-empty image file"
            ));
        }

        try {
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("Invalid file type: {}", contentType);
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "error", "Please upload an image file"
                ));
            }

            // Get waste detection data
            Map<String, Object> detectionData = wasteDetectionService.getWasteDetectionData(file);

            log.info("Successfully retrieved waste detection data for file: {}", file.getOriginalFilename());
            return ResponseEntity.ok(detectionData);

        } catch (IOException e) {
            String errorMessage = e.getMessage();
            log.error("Error getting waste detection data: {}", errorMessage, e);

            // Check if it's a model server connection issue
            if (errorMessage.contains("model server is not running")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of(
                            "status", "error",
                            "error", "The waste detection service is currently unavailable. Please try again later.",
                            "details", "The model server is not running. Please start the model server and try again."
                        ));
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "status", "error",
                        "error", "Error processing waste detection",
                        "details", errorMessage
                    ));
        }
    }

    /**
     * Health check endpoint for the waste detection service
     * 
     * @return Status of the waste detection service
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("Health check requested for waste detection service");
        return ResponseEntity.ok("Waste Detection Service is running");
    }
}
