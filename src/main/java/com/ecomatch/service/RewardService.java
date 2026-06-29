package com.ecomatch.service;

import com.ecomatch.entity.Reward;
import com.ecomatch.repository.RewardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RewardService {

    private static final Logger logger = LoggerFactory.getLogger(RewardService.class);
    private static final int POINTS_PER_KG = 10;

    private final RewardRepository rewardRepository;

    @Autowired
    public RewardService(RewardRepository rewardRepository) {
        this.rewardRepository = rewardRepository;
    }

    public Reward updateRewards(String userId, double wasteAmount) {
        logger.info("Updating rewards for userId: {} with wasteAmount: {}", userId, wasteAmount);
        Reward reward = rewardRepository.findByUserId(userId)
            .orElseGet(() -> {
                Reward newReward = new Reward();
                newReward.setUserId(userId);
                newReward.setPoints(0);
                newReward.setLevel("Bronze");
                return rewardRepository.save(newReward);
            });
        reward.setPoints(reward.getPoints() + (int) (wasteAmount * POINTS_PER_KG));
        Reward updatedReward = rewardRepository.save(reward);
        logger.debug("Reward updated: {}", updatedReward);
        return updatedReward;
    }
}