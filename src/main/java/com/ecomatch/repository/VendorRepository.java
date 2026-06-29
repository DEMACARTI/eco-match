package com.ecomatch.repository;

import com.ecomatch.entity.Vendor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorRepository extends MongoRepository<Vendor, String> {
    // Basic CRUD operations provided by MongoRepository
    // No additional custom queries needed currently
}