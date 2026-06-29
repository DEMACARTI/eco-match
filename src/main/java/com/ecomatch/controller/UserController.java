package com.ecomatch.controller;

import com.ecomatch.entity.*;
import com.ecomatch.repository.*;
import com.ecomatch.service.RequestService; // Added import
import com.ecomatch.service.UserService;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final double CO2_SAVED_PER_KG = 0.25;
    private static final int POINTS_PER_KG = 10;

    private final UserService userService;
    private final RequestService requestService; // Added field
    private final RequestRepository requestRepository;
    private final RewardRepository rewardRepository;
    private final ReviewRepository reviewRepository;
    private final PickupRepository pickupRepository;
    private final CollectedWasteRepository collectedWasteRepository;
    private final VendorRepository vendorRepository;

    @Autowired
    public UserController(UserService userService, RequestService requestService, // Added parameter
                          RequestRepository requestRepository, RewardRepository rewardRepository,
                          ReviewRepository reviewRepository, PickupRepository pickupRepository,
                          CollectedWasteRepository collectedWasteRepository, VendorRepository vendorRepository) {
        this.userService = userService;
        this.requestService = requestService; // Initialize field
        this.requestRepository = requestRepository;
        this.rewardRepository = rewardRepository;
        this.reviewRepository = reviewRepository;
        this.pickupRepository = pickupRepository;
        this.collectedWasteRepository = collectedWasteRepository;
        this.vendorRepository = vendorRepository;
    }

    // Existing methods unchanged (createUser, getUser, updateUser, getUserRequests, getUserRewards, createReview, getVendorReviews, getLeaderboard)

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        logger.info("Creating new user: {}", user);
        if (user == null || user.getId() == null || user.getName() == null || user.getEmail() == null) {
            logger.error("Invalid user data: id={}, name={}, email={}",
                user != null ? user.getId() : null,
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID, name, and email are required");
        }
        User savedUser = userService.saveUser(user);
        logger.info("User created successfully: {}", savedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable String id) {
        logger.info("Fetching user with ID: {}", id);
        if (id == null || id.isEmpty()) {
            logger.error("Invalid user ID: {}", id);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        User user = userService.getUserById(id);
        if (user == null) {
            logger.warn("User not found with ID: {}, initializing default user", id);
            user = userService.initializeDefaultUser(id);
        }
        logger.debug("Returning user: {}", user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        logger.info("Updating user with ID: {}", id);
        if (id == null || id.isEmpty()) {
            logger.error("Invalid user ID: {}", id);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        User existingUser = userService.getUserById(id);
        if (existingUser == null) {
            logger.warn("User not found with ID: {}, creating new user", id);
            existingUser = userService.initializeDefaultUser(id);
        }
        if (user.getName() != null) existingUser.setName(user.getName());
        if (user.getEmail() != null) existingUser.setEmail(user.getEmail());
        if (user.getAddress() != null) existingUser.setAddress(user.getAddress());
        if (user.getPhone() != null) existingUser.setPhone(user.getPhone());
        if (user.getPreferences() != null) existingUser.setPreferences(user.getPreferences());
        if (user.getAddress() != null && !user.getAddress().isEmpty()) {
            User.Location location = existingUser.getLocation() != null ? existingUser.getLocation() : new User.Location();
            location.setLat(40.7128);
            location.setLng(-74.0060);
            existingUser.setLocation(location);
        }
        User updatedUser = userService.saveUser(existingUser);
        logger.info("User updated successfully: {}", updatedUser);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/users/{userId}/requests")
    public ResponseEntity<List<Request>> getUserRequests(@PathVariable String userId) {
        logger.info("Fetching requests for user ID: {}", userId);
        if (userId == null || userId.isEmpty()) {
            logger.error("Invalid user ID: {}", userId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        List<Request> requests = requestRepository.findByUserId(userId);
        logger.debug("Returning {} requests for userId: {}", requests.size(), userId);
        return ResponseEntity.ok(requests != null ? requests : Collections.emptyList());
    }

    @GetMapping("/users/{userId}/rewards")
    public ResponseEntity<Reward> getUserRewards(@PathVariable String userId) {
        logger.info("Fetching rewards for user ID: {}", userId);
        if (userId == null || userId.isEmpty()) {
            logger.error("Invalid user ID: {}", userId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        Reward reward = rewardRepository.findByUserId(userId)
            .orElseGet(() -> {
                logger.warn("No rewards found for user ID: {}, initializing default reward", userId);
                Reward newReward = new Reward();
                newReward.setUserId(userId);
                newReward.setPoints(0);
                newReward.setLevel("Bronze");
                return rewardRepository.save(newReward);
            });
        logger.debug("Returning reward: {}", reward);
        return ResponseEntity.ok(reward);
    }

    @PostMapping("/reviews")
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        logger.info("Creating review: {}", review);
        if (review == null || review.getVendorId() == null || review.getUserId() == null || review.getRating() < 0) {
            logger.error("Invalid review data: vendorId={}, userId={}, rating={}",
                review != null ? review.getVendorId() : null,
                review != null ? review.getUserId() : null,
                review != null ? review.getRating() : -1);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid review: vendorId, userId, and rating >= 0 are required");
        }
        review.setDate(Instant.now().toString());
        Review savedReview = reviewRepository.save(review);
        logger.info("Review created successfully: {}", savedReview);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
    }

    @GetMapping("/vendors/{vendorId}/reviews")
    public ResponseEntity<List<Review>> getVendorReviews(@PathVariable String vendorId) {
        logger.info("Fetching reviews for vendor ID: {}", vendorId);
        if (vendorId == null || vendorId.isEmpty()) {
            logger.error("Invalid vendor ID: {}", vendorId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor ID is required");
        }
        List<Review> reviews = reviewRepository.findByVendorId(vendorId);
        logger.debug("Returning {} reviews for vendorId: {}", reviews.size(), vendorId);
        return ResponseEntity.ok(reviews != null ? reviews : Collections.emptyList());
    }

    @GetMapping("/users/leaderboard")
    public ResponseEntity<List<UserLeaderboardDTO>> getLeaderboard() {
        logger.info("Fetching leaderboard");
        List<UserLeaderboardDTO> leaderboard = userService.getAllUsers().stream()
            .map(u -> {
                UserLeaderboardDTO dto = new UserLeaderboardDTO();
                dto.setId(u.getId());
                dto.setName(u.getName());
                dto.setWasteDiverted(u.getImpactStats() != null ? u.getImpactStats().getWasteDiverted() : 0);
                return dto;
            })
            .sorted((a, b) -> Double.compare(b.getWasteDiverted(), a.getWasteDiverted()))
            .limit(5)
            .collect(Collectors.toList());
        logger.debug("Returning leaderboard with {} entries", leaderboard.size());
        return ResponseEntity.ok(leaderboard);
    }

    // Updated endpoint to process all pending requests for a user
    @PostMapping("/users/{userId}/process-pending-requests")
    public ResponseEntity<String> processPendingRequests(@PathVariable String userId) {
        logger.info("Processing pending requests for user ID: {}", userId);
        if (userId == null || userId.isEmpty()) {
            logger.error("Invalid user ID: {}", userId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }

        try {
            List<Request> pendingRequests = requestRepository.findByUserId(userId)
                .stream()
                .filter(req -> "Pending".equals(req.getStatus()))
                .collect(Collectors.toList());

            if (pendingRequests.isEmpty()) {
                logger.info("No pending requests found for user ID: {}", userId);
                return ResponseEntity.ok("No pending requests to process.");
            }

            for (Request request : pendingRequests) {
                // Step 1: Schedule the pickup
                Pickup pickup = new Pickup();
                pickup.setVendorId(request.getVendorId());
                pickup.setRequestId(request.getId());
                pickup.setStatus("Scheduled");
                pickup.setDate(request.getDate());
                Pickup savedPickup = pickupRepository.save(pickup);

                // Update request to Scheduled
                request.setPickupId(savedPickup.getId());
                request.setStatus("Scheduled");
                requestRepository.save(request);

                // Step 2: Mark as collected and completed
                CollectedWaste collected = new CollectedWaste();
                collected.setVendorId(request.getVendorId());
                collected.setPickupId(savedPickup.getId());
                collected.setType(request.getWasteType());
                collected.setAmount(request.getAmount());
                collected.setDate(request.getDate());
                collected.setStatus("Collected");
                collectedWasteRepository.save(collected);

                request.setStatus("Completed");
                Request completedRequest = requestRepository.save(request);

                // Update vendor stats
                Vendor vendor = vendorRepository.findById(request.getVendorId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Vendor not found with ID: " + request.getVendorId()));
                vendor.setTotalPickups(vendor.getTotalPickups() + 1);
                vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() + request.getAmount());
                vendor.setRevenue(vendor.getRevenue() + request.getEarnings());
                vendorRepository.save(vendor);

                // Update user impact
                userService.updateUserImpact(userId, request.getAmount());
            }

            logger.info("Processed {} pending requests for user ID: {}", pendingRequests.size(), userId);
            return ResponseEntity.ok("Processed " + pendingRequests.size() + " requests for user " + userId);
        } catch (Exception e) {
            logger.error("Error processing pending requests for user ID {}: {}", userId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error processing requests: " + e.getMessage());
        }
    }

    // New endpoint to process a single request
    @PostMapping("/requests/{requestId}/process")
    public ResponseEntity<Request> processRequest(@PathVariable String requestId) {
        logger.info("Processing request with ID: {}", requestId);
        if (requestId == null || requestId.isEmpty()) {
            logger.error("Invalid request ID: {}", requestId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request ID is required");
        }

        Request request = requestService.getRequestById(requestId);
        if (request == null || !"Pending".equals(request.getStatus())) {
            logger.error("Request not found or not in Pending state: {}", requestId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request not found or not in Pending state");
        }

        try {
            // Step 1: Schedule the pickup
            Pickup pickup = new Pickup();
            pickup.setVendorId(request.getVendorId());
            pickup.setRequestId(request.getId());
            pickup.setStatus("Scheduled");
            pickup.setDate(request.getDate());
            Pickup savedPickup = pickupRepository.save(pickup);

            // Update request to Scheduled
            request.setPickupId(savedPickup.getId());
            request.setStatus("Scheduled");
            requestRepository.save(request);

            // Step 2: Mark as collected and completed
            CollectedWaste collected = new CollectedWaste();
            collected.setVendorId(request.getVendorId());
            collected.setPickupId(savedPickup.getId());
            collected.setType(request.getWasteType());
            collected.setAmount(request.getAmount());
            collected.setDate(request.getDate());
            collected.setStatus("Collected");
            collectedWasteRepository.save(collected);

            request.setStatus("Completed");
            Request completedRequest = requestRepository.save(request);

            // Update vendor stats
            Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Vendor not found with ID: " + request.getVendorId()));
            vendor.setTotalPickups(vendor.getTotalPickups() + 1);
            vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() + request.getAmount());
            vendor.setRevenue(vendor.getRevenue() + request.getEarnings());
            vendorRepository.save(vendor);

            // Update user impact
            userService.updateUserImpact(request.getUserId(), request.getAmount());

            logger.info("Request processed successfully: {}", completedRequest);
            return ResponseEntity.ok(completedRequest);
        } catch (Exception e) {
            logger.error("Error processing request ID {}: {}", requestId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error processing request: " + e.getMessage());
        }
    }

    @Data
    public static class UserLeaderboardDTO {
        private String id;
        private String name;
        private double wasteDiverted;
    }
}