package com.ecomatch.controller;

import com.ecomatch.entity.*;
import com.ecomatch.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final RequestRepository requestRepository;
    private final PickupRepository pickupRepository;
    private final CollectedWasteRepository collectedWasteRepository;
    private final ProcessedWasteRepository processedWasteRepository;

    @Autowired
    public AdminController(UserRepository userRepository, 
                          VendorRepository vendorRepository,
                          RequestRepository requestRepository,
                          PickupRepository pickupRepository,
                          CollectedWasteRepository collectedWasteRepository,
                          ProcessedWasteRepository processedWasteRepository) {
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.requestRepository = requestRepository;
        this.pickupRepository = pickupRepository;
        this.collectedWasteRepository = collectedWasteRepository;
        this.processedWasteRepository = processedWasteRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        logger.info("Fetching admin dashboard statistics");
        
        Map<String, Object> stats = new HashMap<>();
        
        // Count users
        long userCount = userRepository.count();
        stats.put("userCount", userCount);
        
        // Count vendors
        long vendorCount = vendorRepository.count();
        stats.put("vendorCount", vendorCount);
        
        // Count requests by status
        List<Request> requests = requestRepository.findAll();
        long pendingRequests = requests.stream().filter(r -> "Pending".equals(r.getStatus())).count();
        long completedRequests = requests.stream().filter(r -> "Completed".equals(r.getStatus())).count();
        stats.put("pendingRequests", pendingRequests);
        stats.put("completedRequests", completedRequests);
        
        // Calculate total waste collected
        List<CollectedWaste> collectedWastes = collectedWasteRepository.findAll();
        double totalWasteCollected = collectedWastes.stream().mapToDouble(CollectedWaste::getAmount).sum();
        stats.put("totalWasteCollected", totalWasteCollected);
        
        // Calculate total waste processed
        List<ProcessedWaste> processedWastes = processedWasteRepository.findAll();
        double totalWasteProcessed = processedWastes.stream().mapToDouble(ProcessedWaste::getAmount).sum();
        stats.put("totalWasteProcessed", totalWasteProcessed);
        
        logger.info("Admin dashboard statistics: {}", stats);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        logger.info("Fetching all users for admin");
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<Vendor>> getAllVendors() {
        logger.info("Fetching all vendors for admin");
        List<Vendor> vendors = vendorRepository.findAll();
        return ResponseEntity.ok(vendors);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<Request>> getAllRequests() {
        logger.info("Fetching all requests for admin");
        List<Request> requests = requestRepository.findAll();
        return ResponseEntity.ok(requests);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String userId) {
        logger.info("Deleting user with ID: {}", userId);
        
        if (!userRepository.existsById(userId)) {
            logger.error("User not found with ID: {}", userId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        
        userRepository.deleteById(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        
        logger.info("User deleted successfully: {}", userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/vendors/{vendorId}")
    public ResponseEntity<Map<String, String>> deleteVendor(@PathVariable String vendorId) {
        logger.info("Deleting vendor with ID: {}", vendorId);
        
        if (!vendorRepository.existsById(vendorId)) {
            logger.error("Vendor not found with ID: {}", vendorId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found");
        }
        
        vendorRepository.deleteById(vendorId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Vendor deleted successfully");
        
        logger.info("Vendor deleted successfully: {}", vendorId);
        return ResponseEntity.ok(response);
    }
}