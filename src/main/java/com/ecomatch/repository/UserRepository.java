package com.ecomatch.repository;

import com.ecomatch.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    // Basic CRUD operations provided by MongoRepository
    // No additional custom queries needed currently
}