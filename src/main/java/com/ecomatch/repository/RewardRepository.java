package com.ecomatch.repository;

import com.ecomatch.entity.Reward;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RewardRepository extends MongoRepository<Reward, String> {
    Optional<Reward> findByUserId(String userId);  // Find reward by user ID
}