package com.ecomatch.repository;

import com.ecomatch.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByVendorId(String vendorId);  // Find all reviews for a vendor
}