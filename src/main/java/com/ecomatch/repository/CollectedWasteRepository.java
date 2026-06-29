package com.ecomatch.repository;

import com.ecomatch.entity.CollectedWaste;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectedWasteRepository extends MongoRepository<CollectedWaste, String> {
    List<CollectedWaste> findByVendorId(String vendorId);      // Find all collected waste for a vendor
    Optional<CollectedWaste> findByPickupId(String pickupId);  // Find collected waste by pickup ID
}