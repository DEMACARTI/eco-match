package com.ecomatch.controller;

import com.ecomatch.entity.*;
import com.ecomatch.repository.*;
import com.ecomatch.service.RequestService;
import com.ecomatch.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class VendorController {

    private static final Logger logger = LoggerFactory.getLogger(VendorController.class);
    private static final double INR_CONVERSION_RATE = 83.0;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final VendorRepository vendorRepository;
    private final RequestService requestService;
    private final RequestRepository requestRepository;
    private final PickupRepository pickupRepository;
    private final CollectedWasteRepository collectedWasteRepository;
    private final ProcessedWasteRepository processedWasteRepository;
    private final UserService userService;

    @Autowired
    public VendorController(VendorRepository vendorRepository, RequestService requestService,
                            RequestRepository requestRepository, PickupRepository pickupRepository,
                            CollectedWasteRepository collectedWasteRepository,
                            ProcessedWasteRepository processedWasteRepository,
                            UserService userService) {
        this.vendorRepository = vendorRepository;
        this.requestService = requestService;
        this.requestRepository = requestRepository;
        this.pickupRepository = pickupRepository;
        this.collectedWasteRepository = collectedWasteRepository;
        this.processedWasteRepository = processedWasteRepository;
        this.userService = userService;
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<Vendor>> getAllVendors(@RequestParam(required = false) String wasteType) {
        logger.info("Fetching vendors with wasteType filter: {}", wasteType);
        List<Vendor> allVendors = vendorRepository.findAll();
        logger.debug("Total vendors fetched: {}", allVendors.size());

        List<Vendor> vendors;
        if (wasteType == null || wasteType.trim().isEmpty()) {
            vendors = allVendors;
        } else {
            vendors = allVendors.stream()
                .filter(v -> {
                    List<String> services = v.getServices() != null ? v.getServices() : Collections.emptyList();
                    boolean matches = services.contains(wasteType);
                    logger.debug("Vendor ID: {}, Services: {}, Matches wasteType '{}': {}", 
                        v.getId(), services, wasteType, matches);
                    return matches;
                })
                .collect(Collectors.toList());
        }
        
        logger.info("Returning {} vendors after filtering", vendors.size());
        return ResponseEntity.ok(vendors);
    }

    @GetMapping("/vendors/{vendorId}")
    public ResponseEntity<Vendor> getVendor(@PathVariable String vendorId) {
        logger.info("Fetching vendor with ID: {}", vendorId);
        try {
            Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found with ID: " + vendorId));
            logger.debug("Vendor services: {}", vendor.getServices());
            return ResponseEntity.ok(vendor);
        } catch (Exception e) {
            logger.error("Error fetching vendor with ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching vendor");
        }
    }

    @PutMapping("/vendors/{vendorId}")
    public ResponseEntity<Vendor> updateVendor(@PathVariable String vendorId, @RequestBody Vendor vendor) {
        logger.info("Updating vendor with ID: {}", vendorId);
        try {
            Vendor existing = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found with ID: " + vendorId));
            
            if (vendor.getName() != null) existing.setName(vendor.getName());
            if (vendor.getEmail() != null) existing.setEmail(vendor.getEmail());
            if (vendor.getAddress() != null) existing.setAddress(vendor.getAddress());
            if (vendor.getServices() != null) existing.setServices(vendor.getServices());
            if (vendor.getPricing() != null) existing.setPricing(vendor.getPricing());
            if (vendor.getAvailability() != null) existing.setAvailability(vendor.getAvailability());
            
            if (vendor.getAddress() != null && !vendor.getAddress().isEmpty()) {
                Vendor.Location location = existing.getLocation() != null ? existing.getLocation() : new Vendor.Location();
                location.setLat(40.7128); // Placeholder
                location.setLng(-74.0060);
                existing.setLocation(location);
            }
            
            Vendor updatedVendor = vendorRepository.save(existing);
            logger.info("Vendor updated: {}", updatedVendor);
            return ResponseEntity.ok(updatedVendor);
        } catch (Exception e) {
            logger.error("Error updating vendor with ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating vendor");
        }
    }

    @GetMapping("/vendors/{vendorId}/requests")
    public ResponseEntity<List<Request>> getVendorRequests(@PathVariable String vendorId) {
        logger.info("Fetching requests for vendor ID: {}", vendorId);
        if (vendorId == null || vendorId.isEmpty()) {
            logger.warn("Invalid vendor ID: {}", vendorId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor ID is required");
        }
        try {
            List<Request> requests = requestService.getRequestsByVendorId(vendorId);
            logger.debug("Returning {} requests for vendorId: {}", requests.size(), vendorId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            logger.error("Error fetching requests for vendor ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching requests");
        }
    }

    @GetMapping("/pickups/vendor/{vendorId}")
    public ResponseEntity<List<Pickup>> getVendorPickups(@PathVariable String vendorId) {
        logger.info("Fetching pickups for vendor ID: {}", vendorId);
        try {
            List<Pickup> pickups = pickupRepository.findByVendorId(vendorId);
            return ResponseEntity.ok(pickups != null ? pickups : Collections.emptyList());
        } catch (Exception e) {
            logger.error("Error fetching pickups for vendor ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching pickups");
        }
    }

    @PostMapping("/pickups")
    public ResponseEntity<Pickup> addPickup(@RequestBody Pickup pickup) {
        logger.info("Adding pickup: {}", pickup);
        if (pickup.getVendorId() == null || pickup.getRequestId() == null) {
            logger.error("Invalid pickup data: vendorId={}, requestId={}", pickup.getVendorId(), pickup.getRequestId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor ID and Request ID are required");
        }
        try {
            pickup.setStatus("Scheduled");
            Request request = requestRepository.findById(pickup.getRequestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Request not found with ID: " + pickup.getRequestId()));
            pickup.setDate(request.getDate() != null ? request.getDate() : LocalDateTime.now().format(DATE_FORMATTER));
            Pickup savedPickup = pickupRepository.save(pickup);
            logger.info("Pickup added: {}", savedPickup);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPickup);
        } catch (Exception e) {
            logger.error("Error adding pickup: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error adding pickup");
        }
    }

    @PutMapping("/pickups/{pickupId}")
    public ResponseEntity<Pickup> updatePickup(@PathVariable String pickupId, @RequestBody Pickup pickup) {
        logger.info("Updating pickup ID: {}", pickupId);
        try {
            Pickup existing = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup not found with ID: " + pickupId));
            if (pickup.getStatus() != null) existing.setStatus(pickup.getStatus());
            if (pickup.getTime() != null) existing.setTime(pickup.getTime());
            if (pickup.getAddress() != null) existing.setAddress(pickup.getAddress());
            if (pickup.getDate() != null && !pickup.getDate().isEmpty()) existing.setDate(pickup.getDate());
            Pickup updatedPickup = pickupRepository.save(existing);
            logger.info("Pickup updated: {}", updatedPickup);
            return ResponseEntity.ok(updatedPickup);
        } catch (Exception e) {
            logger.error("Error updating pickup ID {}: {}", pickupId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating pickup");
        }
    }

    @GetMapping("/collected-waste/vendor/{vendorId}")
    public ResponseEntity<List<CollectedWaste>> getVendorCollectedWaste(@PathVariable String vendorId) {
        logger.info("Fetching collected waste for vendor ID: {}", vendorId);
        try {
            List<CollectedWaste> collectedWaste = collectedWasteRepository.findByVendorId(vendorId);
            return ResponseEntity.ok(collectedWaste != null ? collectedWaste : Collections.emptyList());
        } catch (Exception e) {
            logger.error("Error fetching collected waste for vendor ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching collected waste");
        }
    }

    // Removed @PostMapping("/vendors/collected-waste") to avoid overlap with CollectedWasteController

    @GetMapping("/processed-waste/vendor/{vendorId}")
    public ResponseEntity<List<ProcessedWaste>> getVendorProcessedWaste(@PathVariable String vendorId) {
        logger.info("Fetching processed waste for vendor ID: {}", vendorId);
        try {
            List<ProcessedWaste> processedWaste = processedWasteRepository.findByVendorId(vendorId);
            return ResponseEntity.ok(processedWaste != null ? processedWaste : Collections.emptyList());
        } catch (Exception e) {
            logger.error("Error fetching processed waste for vendor ID {}: {}", vendorId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching processed waste");
        }
    }

    @PostMapping("/processed-waste")
    public ResponseEntity<ProcessedWaste> addProcessedWaste(@RequestBody ProcessedWaste waste) {
        logger.info("Adding processed waste: {}", waste);
        if (waste.getVendorId() == null || waste.getAmount() <= 0) {
            logger.error("Invalid processed waste data: vendorId={}, amount={}", waste.getVendorId(), waste.getAmount());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Vendor ID and amount > 0 are required");
        }
        try {
            double revenue = waste.getAmount() * waste.getPricing() * INR_CONVERSION_RATE;
            waste.setRevenue(revenue);
            waste.setDateProcessed(LocalDateTime.now().format(DATE_FORMATTER));
            ProcessedWaste savedWaste = processedWasteRepository.save(waste);
            logger.info("Processed waste added: {}", savedWaste);

            // Update vendor stats
            Vendor vendor = vendorRepository.findById(waste.getVendorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Vendor not found with ID: " + waste.getVendorId()));
            vendor.setTotalWasteProcessed(vendor.getTotalWasteProcessed() + waste.getAmount());
            vendor.setRevenue(vendor.getRevenue() + revenue);
            vendorRepository.save(vendor);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedWaste);
        } catch (Exception e) {
            logger.error("Error adding processed waste: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error adding processed waste");
        }
    }
}