package com.ecomatch.service;

import com.ecomatch.entity.Pickup;
import com.ecomatch.entity.Vendor;
import com.ecomatch.repository.PickupRepository;
import com.ecomatch.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PickupService {

    private static final Logger logger = LoggerFactory.getLogger(PickupService.class);

    private final PickupRepository pickupRepository;
    private final VendorRepository vendorRepository;

    @Autowired
    public PickupService(PickupRepository pickupRepository, VendorRepository vendorRepository) {
        this.pickupRepository = pickupRepository;
        this.vendorRepository = vendorRepository;
    }

    public Pickup schedulePickup(Pickup pickup) {
        if (pickup == null || pickup.getVendorId() == null || pickup.getTime() == null) {
            logger.warn("Invalid pickup data: {}", pickup);
            throw new IllegalArgumentException("Pickup must have a valid vendorId and time");
        }

        logger.info("Scheduling pickup for vendor ID: {}", pickup.getVendorId());
        Vendor vendor = vendorRepository.findById(pickup.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Vendor not found with ID: {}", pickup.getVendorId());
                    return new RuntimeException("Vendor not found with ID: " + pickup.getVendorId());
                });

        vendor.setTotalPickups(vendor.getTotalPickups() + 1);
        vendorRepository.save(vendor);
        logger.info("Updated vendor total pickups: {}", vendor.getTotalPickups());

        Pickup savedPickup = pickupRepository.save(pickup);
        logger.info("Pickup scheduled: {}", savedPickup);
        return savedPickup;
    }

    public Pickup updatePickup(String id, Pickup updatedPickup) {
        if (id == null || updatedPickup == null || updatedPickup.getVendorId() == null || updatedPickup.getTime() == null) {
            logger.warn("Invalid update data - ID: {}, Updated Pickup: {}", id, updatedPickup);
            throw new IllegalArgumentException("ID, vendorId, and time are required for update");
        }

        logger.info("Updating pickup with ID: {}", id);
        Pickup existing = pickupRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Pickup not found with ID: {}", id);
                    return new RuntimeException("Pickup not found with ID: " + id);
                });

        Vendor oldVendor = vendorRepository.findById(existing.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Old vendor not found with ID: {}", existing.getVendorId());
                    return new RuntimeException("Old vendor not found with ID: " + existing.getVendorId());
                });

        // Decrease old vendor's totalPickups
        oldVendor.setTotalPickups(oldVendor.getTotalPickups() - 1);

        Vendor newVendor = vendorRepository.findById(updatedPickup.getVendorId())
                .orElseThrow(() -> {
                    logger.error("New vendor not found with ID: {}", updatedPickup.getVendorId());
                    return new RuntimeException("New vendor not found with ID: " + updatedPickup.getVendorId());
                });

        // Increase new vendor's totalPickups
        newVendor.setTotalPickups(newVendor.getTotalPickups() + 1);

        vendorRepository.save(oldVendor);
        vendorRepository.save(newVendor);
        logger.info("Updated old vendor total pickups: {}, new vendor total pickups: {}", oldVendor.getTotalPickups(), newVendor.getTotalPickups());

        existing.setVendorId(updatedPickup.getVendorId());
        existing.setTime(updatedPickup.getTime()); // Changed from setScheduledTime
        Pickup updated = pickupRepository.save(existing);
        logger.info("Pickup updated: {}", updated);
        return updated;
    }

    public void cancelPickup(String id) {
        if (id == null) {
            logger.warn("Invalid ID for cancellation: null");
            throw new IllegalArgumentException("ID is required to cancel pickup");
        }

        logger.info("Cancelling pickup with ID: {}", id);
        Pickup pickup = pickupRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Pickup not found with ID: {}", id);
                    return new RuntimeException("Pickup not found with ID: " + id);
                });

        Vendor vendor = vendorRepository.findById(pickup.getVendorId())
                .orElseThrow(() -> {
                    logger.error("Vendor not found with ID: {}", pickup.getVendorId());
                    return new RuntimeException("Vendor not found with ID: " + pickup.getVendorId());
                });

        vendor.setTotalPickups(vendor.getTotalPickups() - 1);
        vendorRepository.save(vendor);
        logger.info("Updated vendor total pickups after cancellation: {}", vendor.getTotalPickups());

        pickupRepository.deleteById(id);
        logger.info("Pickup with ID: {} cancelled", id);
    }
}