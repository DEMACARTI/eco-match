package com.ecomatch.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "users")
@Data
public class Users{
    @Id
    private String id;
    private String name;
    private String email;
    private String address;
    private String phone;
    private List<String> preferences;
    private Location location;
    private ImpactStats impactStats;

    @Data
    public static class Location {
        private double lat;
        private double lng;
    }

    @Data
    public static class ImpactStats {
        private double wasteDiverted;
        private double co2Saved;
    }
}