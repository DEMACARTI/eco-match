package com.ecomatch.controller;

import com.ecomatch.entity.CollectedWaste;
import com.ecomatch.entity.Request;
import com.ecomatch.repository.CollectedWasteRepository;
import com.ecomatch.repository.RequestRepository;
import com.ecomatch.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/collected-waste")
@CrossOrigin(origins = "http://localhost:5173")
public class CollectedWasteController {

    private static final Logger logger = LoggerFactory.getLogger(CollectedWasteController.class);

    private final CollectedWasteRepository collectedWasteRepository;
    private final RequestRepository requestRepository;
    private final UserService userService;

    @Autowired
    public CollectedWasteController(CollectedWasteRepository collectedWasteRepository,
                                    RequestRepository requestRepository, UserService userService) {
        this.collectedWasteRepository = collectedWasteRepository;
        this.requestRepository = requestRepository;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<CollectedWaste> addCollectedWaste(@RequestBody CollectedWaste collectedWaste) {
        logger.info("Adding collected waste: {}", collectedWaste);
        if (collectedWaste.getPickupId() == null || collectedWaste.getAmount() <= 0) {
            logger.error("Invalid collected waste data: pickupId={}, amount={}",
                collectedWaste.getPickupId(), collectedWaste.getAmount());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Pickup ID and amount > 0 are required");
        }

        CollectedWaste saved = collectedWasteRepository.save(collectedWaste);
        Request request = requestRepository.findByPickupId(saved.getPickupId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Request not found for pickup ID: " + saved.getPickupId()));
        request.setStatus("Completed");
        requestRepository.save(request);

        userService.updateUserImpact(request.getUserId(), saved.getAmount());
        logger.info("Collected waste added successfully: {}", saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}