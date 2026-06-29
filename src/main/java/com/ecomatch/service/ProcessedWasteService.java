package com.ecomatch.service;

import com.ecomatch.entity.ProcessedWaste;
import com.ecomatch.entity.Vendor;
import com.ecomatch.repository.ProcessedWasteRepository;
import com.ecomatch.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProcessedWasteService {

    private final ProcessedWasteRepository processedWasteRepository;
    private final VendorRepository vendorRepository;

    @Autowired
    public ProcessedWasteService(ProcessedWasteRepository processedWasteRepository, VendorRepository vendorRepository) {
        this.processedWasteRepository = processedWasteRepository;
        this.vendorRepository = vendorRepository;
    }

    public ProcessedWaste addProcessedWaste(ProcessedWaste processedWaste) {
        Vendor vendor = vendorRepository.findById(processedWaste.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setTotalWasteProcessed(vendor.getTotalWasteProcessed() + processedWaste.getAmount());
        vendor.setRevenue(vendor.getRevenue() + processedWaste.getRevenue());
        vendorRepository.save(vendor);
        return processedWasteRepository.save(processedWaste);
    }

    public ProcessedWaste updateProcessedWaste(String id, ProcessedWaste updatedWaste) {
        ProcessedWaste existing = processedWasteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Processed waste not found"));
        Vendor vendor = vendorRepository.findById(existing.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        vendor.setTotalWasteProcessed(vendor.getTotalWasteProcessed() - existing.getAmount() + updatedWaste.getAmount());
        vendor.setRevenue(vendor.getRevenue() - existing.getRevenue() + updatedWaste.getRevenue());
        vendorRepository.save(vendor);
        existing.setAmount(updatedWaste.getAmount());
        existing.setRevenue(updatedWaste.getRevenue());
        return processedWasteRepository.save(existing);
    }
}