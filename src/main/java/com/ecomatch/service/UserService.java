package com.ecomatch.service;

import com.ecomatch.entity.Reward;
import com.ecomatch.entity.User;
import com.ecomatch.repository.RewardRepository;
import com.ecomatch.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final double CO2_SAVED_PER_KG = 0.25;
    private static final int POINTS_PER_KG = 10;

    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;

    @Autowired
    public UserService(UserRepository userRepository, RewardRepository rewardRepository) {
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
    }

    public User saveUser(User user) {
        logger.info("Saving user: {}", user);
        if (user.getId() == null || user.getId().isEmpty()) {
            logger.error("User ID is required for saving");
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }

        if (user.getPreferences() == null) {
            user.setPreferences(new HashMap<>());
            user.getPreferences().put("notifications", false);
            user.getPreferences().put("preferredTime", "Morning");
        }
        if (user.getImpactStats() == null) {
            user.setImpactStats(new User.ImpactStats());
        }

        User savedUser = userRepository.save(user);
        logger.debug("User saved successfully: {}", savedUser);
        return savedUser;
    }

    public User getUserById(String id) {
        logger.info("Fetching user by ID: {}", id);
        if (id == null || id.isEmpty()) {
            logger.error("Invalid user ID provided: {}", id);
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            logger.warn("No user found with ID: {}", id);
        } else {
            logger.debug("User found: {}", user);
        }
        return user;
    }

    public List<User> getAllUsers() {
        logger.info("Fetching all users for leaderboard");
        List<User> users = userRepository.findAll();
        if (users == null || users.isEmpty()) {
            logger.warn("No users found in the database");
            return Collections.emptyList();
        }
        logger.debug("Total users fetched: {}", users.size());
        return users;
    }

    public User initializeDefaultUser(String id) {
        logger.info("Initializing default user with ID: {}", id);
        User defaultUser = new User();
        defaultUser.setId(id);
        defaultUser.setName("Default User");
        defaultUser.setEmail(id + "@example.com");
        defaultUser.setPreferences(new HashMap<>());
        defaultUser.getPreferences().put("notifications", false);
        defaultUser.getPreferences().put("preferredTime", "Morning");
        defaultUser.setImpactStats(new User.ImpactStats());
        return saveUser(defaultUser);
    }

    public void updateUserImpact(String userId, double wasteAmount) {
        logger.info("Updating user impact for userId: {} with wasteAmount: {}", userId, wasteAmount);
        User user = getUserById(userId);
        if (user == null) {
            logger.warn("User not found, initializing default user for ID: {}", userId);
            user = initializeDefaultUser(userId);
        }

        User.ImpactStats stats = user.getImpactStats();
        stats.setWasteDiverted(stats.getWasteDiverted() + wasteAmount);
        stats.setCo2Saved(stats.getCo2Saved() + wasteAmount * CO2_SAVED_PER_KG);
        user.setImpactStats(stats);
        saveUser(user);
        logger.debug("User impact updated: {}", user);

        Reward reward = rewardRepository.findByUserId(userId)
            .orElseGet(() -> {
                Reward newReward = new Reward();
                newReward.setUserId(userId);
                newReward.setPoints(0);
                newReward.setLevel("Bronze");
                return rewardRepository.save(newReward);
            });
        reward.setPoints(reward.getPoints() + (int) (wasteAmount * POINTS_PER_KG));
        rewardRepository.save(reward);
        logger.debug("User reward updated: {}", reward);
    }
}