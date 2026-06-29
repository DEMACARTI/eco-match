package com.ecomatch.service;

import com.ecomatch.entity.Request;
import com.ecomatch.repository.RequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RequestService {

    private static final Logger logger = LoggerFactory.getLogger(RequestService.class);

    private final RequestRepository requestRepository;

    @Autowired
    public RequestService(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    public Request createRequest(Request request) {
        logger.info("Creating new request: {}", request);
        if (request.getVendorId() == null || request.getUserId() == null) {
            logger.error("Cannot create request: vendorId or userId is null");
            throw new IllegalArgumentException("vendorId and userId must not be null");
        }
        // Explicitly set status to "Pending" and timestamp
        request.setStatus("Pending");
        request.setTimestamp(LocalDateTime.now().toString());
        Request savedRequest = requestRepository.save(request);
        logger.info("Request saved successfully: {}", savedRequest);
        return savedRequest;
    }

    public Request getRequestById(String requestId) {
        logger.info("Fetching request by ID: {}", requestId);
        if (requestId == null || requestId.isEmpty()) {
            logger.warn("Invalid request ID: {}", requestId);
            return null;
        }
        Request request = requestRepository.findById(requestId).orElse(null);
        if (request == null) {
            logger.warn("Request not found with ID: {}", requestId);
        }
        return request;
    }

    public List<Request> getRequestsByVendorId(String vendorId) {
        logger.info("Fetching requests for vendor ID: {}", vendorId);
        if (vendorId == null || vendorId.isEmpty()) {
            logger.warn("Invalid vendor ID: {}", vendorId);
            return List.of();
        }
        List<Request> requests = requestRepository.findByVendorId(vendorId);
        logger.debug("Found {} requests for vendorId: {}", requests.size(), vendorId);
        return requests != null ? requests : List.of();
    }

    public List<Request> getRequestsByUserId(String userId) {
        logger.info("Fetching requests for user ID: {}", userId);
        if (userId == null || userId.isEmpty()) {
            logger.warn("Invalid user ID: {}", userId);
            return List.of();
        }
        List<Request> requests = requestRepository.findByUserId(userId);
        logger.debug("Found {} requests for userId: {}", requests.size(), userId);
        return requests != null ? requests : List.of();
    }

    public Request updateRequest(String id, Request request) {
        logger.info("Updating request with ID: {}", id);
        if (id == null || id.isEmpty()) {
            logger.error("Invalid request ID: {}", id);
            throw new IllegalArgumentException("Request ID cannot be null or empty");
        }
        Request existing = requestRepository.findById(id)
            .orElseThrow(() -> {
                logger.error("Request not found with ID: {}", id);
                return new IllegalArgumentException("Request not found with ID: " + id);
            });
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        if (request.getNotes() != null) existing.setNotes(request.getNotes());
        if (request.getDate() != null && !request.getDate().isEmpty()) existing.setDate(request.getDate());
        if (request.getPickupId() != null) existing.setPickupId(request.getPickupId());
        if (request.getWasteType() != null) existing.setWasteType(request.getWasteType());
        if (request.getAmount() > 0) existing.setAmount(request.getAmount());
        if (request.getEarnings() >= 0) existing.setEarnings(request.getEarnings());
        if (request.getRecurring() != null) existing.setRecurring(request.getRecurring());
        if (request.getFrequency() != null) existing.setFrequency(request.getFrequency());
        Request updatedRequest = requestRepository.save(existing);
        logger.info("Request updated successfully: {}", updatedRequest);
        return updatedRequest;
    }
}