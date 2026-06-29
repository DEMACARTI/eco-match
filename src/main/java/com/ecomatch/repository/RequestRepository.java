package com.ecomatch.repository;

import com.ecomatch.entity.Request;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends MongoRepository<Request, String> {
    Optional<Request> findById(String id);              // Find request by its ID
    List<Request> findByVendorId(String vendorId);      // Find all requests for a vendor
    List<Request> findByUserId(String userId);          // Find all requests for a user
    Optional<Request> findByPickupId(String pickupId);  // Find request by pickup ID
}