package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "vendors")
public class Vendor {
    @Id
    private String id;
    private String name;
    private String email;
    private String address;
    private List<String> services = new ArrayList<>(); // Initialize to avoid null
    private Map<String, Double> pricing;               // e.g., {"Plastic": 0.5, "Paper": 0.3}
    private String availability;                       // e.g., "Mon-Fri 9-5"
    private Location location;
    private int totalPickups = 0;
    private double totalWasteCollected = 0.0;
    private double totalWasteProcessed = 0.0;
    private double revenue = 0.0;

    public static class Location {
        private double lat;
        private double lng;

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }

        @Override
        public String toString() {
            return "Location{lat=" + lat + ", lng=" + lng + "}";
        }
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<String> getServices() { return services; }
    public void setServices(List<String> services) { this.services = services != null ? services : new ArrayList<>(); }
    public Map<String, Double> getPricing() { return pricing; }
    public void setPricing(Map<String, Double> pricing) { this.pricing = pricing; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    public int getTotalPickups() { return totalPickups; }
    public void setTotalPickups(int totalPickups) { this.totalPickups = totalPickups; }
    public double getTotalWasteCollected() { return totalWasteCollected; }
    public void setTotalWasteCollected(double totalWasteCollected) { this.totalWasteCollected = totalWasteCollected; }
    public double getTotalWasteProcessed() { return totalWasteProcessed; }
    public void setTotalWasteProcessed(double totalWasteProcessed) { this.totalWasteProcessed = totalWasteProcessed; }
    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }

    @Override
    public String toString() {
        return "Vendor{" +
               "id='" + id + '\'' +
               ", name='" + name + '\'' +
               ", email='" + email + '\'' +
               ", address='" + address + '\'' +
               ", services=" + services +
               ", pricing=" + pricing +
               ", availability='" + availability + '\'' +
               ", location=" + location +
               ", totalPickups=" + totalPickups +
               ", totalWasteCollected=" + totalWasteCollected +
               ", totalWasteProcessed=" + totalWasteProcessed +
               ", revenue=" + revenue +
               '}';
    }
}