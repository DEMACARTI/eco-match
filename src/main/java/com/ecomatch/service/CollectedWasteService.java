package com.ecomatch.service;

import com.ecomatch.entity.CollectedWaste;
import com.ecomatch.entity.Vendor;
import com.ecomatch.repository.CollectedWasteRepository;
import com.ecomatch.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CollectedWasteService {

    private static final Logger logger = LoggerFactory.getLogger(CollectedWasteService.class);

    private final CollectedWasteRepository collectedWasteRepository;
    private final VendorRepository vendorRepository;

    @Autowired
    public CollectedWasteService(CollectedWasteRepository collectedWasteRepository, VendorRepository vendorRepository) {
        this.collectedWasteRepository = collectedWasteRepository;
        this.vendorRepository = vendorRepository;
    }

    public CollectedWaste addCollectedWaste(CollectedWaste collectedWaste) {
        if (collectedWaste == null || collectedWaste.getVendorId() == null || collectedWaste.getAmount() <= 0) {
            logger.warn("Invalid collected waste data: {}", collectedWaste);
            throw new IllegalArgumentException("Collected waste must have a valid vendorId and amount > 0");
        }

        logger.info("Adding collected waste for vendor ID: {}", collectedWaste.getVendorId());
        Vendor vendor = vendorRepository.findById(collectedWaste.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Vendor not found with ID: {}", collectedWaste.getVendorId());
                    return new RuntimeException("Vendor not found with ID: " + collectedWaste.getVendorId());
                });

        vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() + collectedWaste.getAmount());
        vendorRepository.save(vendor);
        logger.info("Updated vendor total waste collected: {}", vendor.getTotalWasteCollected());

        CollectedWaste savedWaste = collectedWasteRepository.save(collectedWaste);
        logger.info("Collected waste saved: {}", savedWaste);
        return savedWaste;
    }

    public CollectedWaste updateCollectedWaste(String id, CollectedWaste updatedWaste) {
        if (id == null || updatedWaste == null || updatedWaste.getAmount() <= 0) {
            logger.warn("Invalid update data - ID: {}, Updated Waste: {}", id, updatedWaste);
            throw new IllegalArgumentException("ID and valid updated waste data (amount > 0) are required");
        }

        logger.info("Updating collected waste with ID: {}", id);
        CollectedWaste existing = collectedWasteRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Collected waste not found with ID: {}", id);
                    return new RuntimeException("Collected waste not found with ID: " + id);
                });

        Vendor vendor = vendorRepository.findById(existing.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Vendor not found with ID: {}", existing.getVendorId());
                    return new RuntimeException("Vendor not found with ID: " + existing.getVendorId());
                });

        vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() - existing.getAmount() + updatedWaste.getAmount());
        vendorRepository.save(vendor);
        logger.info("Updated vendor total waste collected: {}", vendor.getTotalWasteCollected());

        existing.setAmount(updatedWaste.getAmount());
        if (updatedWaste.getType() != null) {
            existing.setType(updatedWaste.getType()); // Changed from setWasteType
        }
        CollectedWaste updated = collectedWasteRepository.save(existing);
        logger.info("Collected waste updated: {}", updated);
        return updated;
    }

    public void deleteCollectedWaste(String id) {
        if (id == null) {
            logger.warn("Invalid ID for deletion: null");
            throw new IllegalArgumentException("ID is required to delete collected waste");
        }

        logger.info("Deleting collected waste with ID: {}", id);
        CollectedWaste waste = collectedWasteRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Collected waste not found with ID: {}", id);
                    return new RuntimeException("Collected waste not found with ID: " + id);
                });

        Vendor vendor = vendorRepository.findById(waste.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Vendor not found with ID: {}", waste.getVendorId());
                    return new RuntimeException("Vendor not found with ID: " + waste.getVendorId());
                });

        vendor.setTotalWasteCollected(vendor.getTotalWasteCollected() - waste.getAmount());
        vendorRepository.save(vendor);
        logger.info("Updated vendor total waste collected after deletion: {}", vendor.getTotalWasteCollected());

        collectedWasteRepository.deleteById(id);
        logger.info("Collected waste with ID: {} deleted", id);
    }
}