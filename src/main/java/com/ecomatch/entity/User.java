package com.ecomatch.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String address;
    private String phone;
    private Map<String, Object> preferences;
    private Location location;
    private ImpactStats impactStats;

    public User() {
        this.preferences = new HashMap<>();
        this.impactStats = new ImpactStats();
    }

    public Map<String, Object> getPreferences() {
        if (preferences == null) preferences = new HashMap<>();
        return preferences;
    }

    public ImpactStats getImpactStats() {
        if (impactStats == null) impactStats = new ImpactStats();
        return impactStats;
    }

    @Data
    public static class Location {
        private double lat;
        private double lng;
    }

    @Data
    public static class ImpactStats {
        private double wasteDiverted = 0.0;
        private double co2Saved = 0.0;
    }
}