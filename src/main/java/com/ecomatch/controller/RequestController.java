package com.ecomatch.controller;

import com.ecomatch.entity.*;
import com.ecomatch.repository.*;
import com.ecomatch.service.RequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class RequestController {

    private static final Logger logger = LoggerFactory.getLogger(RequestController.class);
    private static final double CO2_SAVED_PER_KG = 0.25;
    private static final int POINTS_PER_KG = 10;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final RequestService requestService;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final PickupRepository pickupRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public RequestController(RequestService requestService, VendorRepository vendorRepository,
                             UserRepository userRepository, RewardRepository rewardRepository,
                             PickupRepository pickupRepository, CollectedWasteRepository collectedWasteRepository,
                             SimpMessagingTemplate messagingTemplate) {
        this.requestService = requestService;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.pickupRepository = pickupRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<Request> createRequest(@RequestBody Request request) {
        logger.info("Creating waste request: {}", request);
        if (request.getVendorId() == null || request.getUserId() == null || 
            request.getWasteType() == null || request.getAmount() <= 0) {
            logger.error("Invalid request data: vendorId={}, userId={}, wasteType={}, amount={}",
                request.getVendorId(), request.getUserId(), request.getWasteType(), request.getAmount());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Invalid request: vendorId, userId, wasteType, and amount > 0 are required");
        }

        Vendor vendor = vendorRepository.findById(request.getVendorId())
            .orElseThrow(() -> {
                logger.error("Vendor not found with ID: {}", request.getVendorId());
                return new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Vendor not found with ID: " + request.getVendorId());
            });

        double pricePerUnit = vendor.getPricing() != null ? 
            vendor.getPricing().getOrDefault(request.getWasteType(), 0.0) : 0.0;
        request.setEarnings(pricePerUnit * request.getAmount());
        request.setStatus("Pending");
        request.setTimestamp(LocalDateTime.now().format(DATE_FORMATTER));
        if (request.getDate() == null || request.getDate().isEmpty()) {
            request.setDate(LocalDateTime.now().format(DATE_FORMATTER));
        }
        if (request.getRecurring() == null) request.setRecurring(false);
        if (request.getRecurring() && request.getFrequency() == null) request.setFrequency("Weekly");

        Request savedRequest = requestService.createRequest(request);
        if (savedRequest == null) {
            logger.error("Failed to save request: {}", request);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create request");
        }

        messagingTemplate.convertAndSend("/topic/requests/" + savedRequest.getUserId(), savedRequest);
        logger.info("Request created successfully: {}", savedRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<Request> getRequest(@PathVariable String requestId) {
        logger.info("Fetching request with ID: {}", requestId);
        Request request = requestService.getRequestById(requestId);
        if (request == null) {
            logger.error("Request not found with ID: {}", requestId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found with ID: " + requestId);
        }
        return ResponseEntity.ok(request);
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<Request>> getVendorRequests(@PathVariable String vendorId) {
        logger.info("Fetching requests for vendor ID: {}", vendorId);
        if (vendorId == null || vendorId.isEmpty()) {
            logger.warn("Invalid vendor ID: {}", vendorId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor ID is required");
        }
        List<Request> requests = requestService.getRequestsByVendorId(vendorId);
        logger.debug("Returning {} requests for vendorId: {}", requests.size(), vendorId);
        return ResponseEntity.ok(requests != null ? requests : Collections.emptyList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Request>> getUserRequests(@PathVariable String userId) {
        logger.info("Fetching requests for user ID: {}", userId);
        if (userId == null || userId.isEmpty()) {
            logger.warn("Invalid user ID: {}", userId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        List<Request> requests = requestService.getRequestsByUserId(userId);
        return ResponseEntity.ok(requests != null ? requests : Collections.emptyList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Request> updateRequest(@PathVariable String id, @RequestBody Request request) {
        logger.info("Updating request with ID: {}", id);
        Request existingRequest = requestService.getRequestById(id);
        if (existingRequest == null) {
            logger.error("Request not found with ID: {}", id);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found with ID: " + id);
        }

        if (request.getStatus() != null) existingRequest.setStatus(request.getStatus());
        if (request.getWasteType() != null) existingRequest.setWasteType(request.getWasteType());
        if (request.getAmount() > 0) existingRequest.setAmount(request.getAmount());
        if (request.getDate() != null) existingRequest.setDate(request.getDate());
        if (request.getNotes() != null) existingRequest.setNotes(request.getNotes());
        if (request.getRecurring() != null) existingRequest.setRecurring(request.getRecurring());
        if (request.getFrequency() != null) existingRequest.setFrequency(request.getFrequency());

        if (Boolean.TRUE.equals(existingRequest.getRecurring()) && existingRequest.getFrequency() == null) {
            existingRequest.setFrequency("Weekly");
        } else if (Boolean.FALSE.equals(existingRequest.getRecurring())) {
            existingRequest.setFrequency(null);
        }

        Request updatedRequest = requestService.updateRequest(id, existingRequest);

        if ("Completed".equals(updatedRequest.getStatus()) && !"Completed".equals(existingRequest.getStatus())) {
            updateStatsOnCompletion(updatedRequest);
        }

        messagingTemplate.convertAndSend("/topic/requests/" + updatedRequest.getUserId(), updatedRequest);
        logger.info("Request updated successfully: {}", updatedRequest);
        return ResponseEntity.ok(updatedRequest);
    }

    @PutMapping("/{id}/process")
    public ResponseEntity<Request> processRequest(@PathVariable String id) {
        logger.info("Processing request with ID: {}", id);
        Request existingRequest = requestService.getRequestById(id);
        if (existingRequest == null) {
            logger.error("Request not found with ID: {}", id);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found with ID: " + id);
        }

        if (!"Pending".equals(existingRequest.getStatus())) {
            logger.warn("Request cannot be processed, current status: {}", existingRequest.getStatus());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Request must be in 'Pending' status to process");
        }

        // Create a Pickup entity
        Pickup pickup = new Pickup();
        pickup.setVendorId(existingRequest.getVendorId());
        pickup.setUserId(existingRequest.getUserId());
        pickup.setRequestId(id);
        pickup.setStatus("Scheduled");
        pickup.setDate(existingRequest.getDate()); // Use request date as default
        Pickup savedPickup = pickupRepository.save(pickup);

        // Update request status and link to pickup
        existingRequest.setStatus("Scheduled");
        existingRequest.setPickupId(savedPickup.getId());
        Request updatedRequest = requestService.updateRequest(id, existingRequest);

        // Broadcast the updated request
        messagingTemplate.convertAndSend("/topic/requests/" + updatedRequest.getUserId(), updatedRequest);

        logger.info("Request processed successfully: {}, Pickup created: {}", updatedRequest, savedPickup);
        return ResponseEntity.ok(updatedRequest);
    }

    private void updateStatsOnCompletion(Request request) {
        Vendor vendor = vendorRepository.findById(request.getVendorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Vendor not found with ID: " + request.getVendorId()));
        vendor.setTotalPickups(vendor.getTotalPickups() + 1);
        vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() + request.getAmount());
        vendor.setRevenue(vendor.getRevenue() + request.getEarnings());
        vendorRepository.save(vendor);

        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "User not found with ID: " + request.getUserId()));
        User.ImpactStats stats = user.getImpactStats();
        stats.setWasteDiverted(stats.getWasteDiverted() + request.getAmount());
        stats.setCo2Saved(stats.getCo2Saved() + (request.getAmount() * CO2_SAVED_PER_KG));
        user.setImpactStats(stats);
        userRepository.save(user);

        Reward reward = rewardRepository.findByUserId(request.getUserId())
            .orElseGet(() -> {
                Reward newReward = new Reward();
                newReward.setUserId(request.getUserId());
                newReward.setPoints(0);
                newReward.setLevel("Bronze");
                return rewardRepository.save(newReward);
            });
        int newPoints = reward.getPoints() + (int) (request.getAmount() * POINTS_PER_KG);
        reward.setPoints(newPoints);
        rewardRepository.save(reward);

        logger.info("Stats updated: Vendor={}, User={}, Reward={}", vendor, user, reward);
    }
}