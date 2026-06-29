package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "rewards")
public class Reward {
    @Id
    private String id;
    private String userId;
    private int points;
    private String level;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public int getPoints() { return points; }
    public void setPoints(int points) {
        this.points = points;
        this.level = getLevel(points);
    }
    public String getLevel() { return level != null ? level : "Bronze"; }
    public void setLevel(String level) { this.level = level; }

    private String getLevel(int points) {
        if (points >= 1000) return "Platinum";
        if (points >= 500) return "Gold";
        if (points >= 200) return "Silver";
        return "Bronze";
    }

    @Override
    public String toString() {
        return "Reward{id='" + id + "', userId='" + userId + "', points=" + points + ", level='" + level + "'}";
    }
}