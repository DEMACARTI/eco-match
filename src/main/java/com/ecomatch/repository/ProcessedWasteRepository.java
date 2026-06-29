package com.ecomatch.repository;

import com.ecomatch.entity.ProcessedWaste;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessedWasteRepository extends MongoRepository<ProcessedWaste, String> {
    List<ProcessedWaste> findByVendorId(String vendorId);
}