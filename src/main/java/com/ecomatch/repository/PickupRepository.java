package com.ecomatch.repository;

import com.ecomatch.entity.Pickup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends MongoRepository<Pickup, String> {
    List<Pickup> findByVendorId(String vendorId);      // Find all pickups for a vendor
    Optional<Pickup> findByRequestId(String requestId); // Find pickup by request ID
}