package com.ecomatch.service;

import com.ecomatch.entity.Vendor;
import com.ecomatch.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VendorService {

    private static final Logger logger = LoggerFactory.getLogger(VendorService.class);

    @Autowired
    private VendorRepository vendorRepository;

    public Vendor getVendorById(String vendorId) {
        logger.info("Fetching vendor with ID: {}", vendorId);
        return vendorRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found with ID: " + vendorId));
    }

    public Vendor saveVendor(Vendor vendor) {
        logger.info("Saving vendor: {}", vendor);
        return vendorRepository.save(vendor);
    }

    public Vendor updateVendor(String vendorId, Vendor vendor) {
        logger.info("Updating vendor with ID: {}", vendorId);
        Vendor existing = getVendorById(vendorId);
        existing.setName(vendor.getName());
        existing.setEmail(vendor.getEmail());
        existing.setAddress(vendor.getAddress());
        existing.setServices(vendor.getServices());
        existing.setPricing(vendor.getPricing());
        existing.setAvailability(vendor.getAvailability());
        if (vendor.getAddress() != null && !vendor.getAddress().isEmpty()) {
            Vendor.Location location = new Vendor.Location();
            location.setLat(40.7128); // Placeholder
            location.setLng(-74.0060);
            existing.setLocation(location);
        }
        Vendor updatedVendor = vendorRepository.save(existing);
        logger.info("Vendor updated: {}", updatedVendor);
        return updatedVendor;
    }
}