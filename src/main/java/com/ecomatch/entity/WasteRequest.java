package com.ecomatch.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "waste_requests")
public class WasteRequest {
    @Id
    private String id;
    private String userId;
    private User.Location userLocation;
    private String vendorId;
    private String wasteType;
    private double amount;
    private String date; // Consider using LocalDateTime for better date handling
    private String notes;
    private boolean recurring;
    private String frequency;
    private String status; // e.g., "Pending", "Scheduled", "Collected", "Cancelled"
    private String timestamp; // Consider using Instant or LocalDateTime
    private double earnings;
    private String pickupId; // New field to link to Pickup entity

    // Optional: Enum for status to enforce valid values
    public enum Status {
        PENDING("Pending"),
        SCHEDULED("Scheduled"),
        COLLECTED("Collected"),
        CANCELLED("Cancelled");

        private final String value;

        Status(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    // Optional: Setter to enforce enum values if using Status enum
    public void setStatus(String status) {
        if (status != null) {
            for (Status s : Status.values()) {
                if (s.getValue().equalsIgnoreCase(status)) {
                    this.status = s.getValue();
                    return;
                }
            }
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        this.status = status;
    }

    // Default constructor for frameworks like Spring Data
    public WasteRequest() {
    }

    // Convenience constructor for common fields
    public WasteRequest(String userId, String vendorId, String wasteType, double amount, String date) {
        this.userId = userId;
        this.vendorId = vendorId;
        this.wasteType = wasteType;
        this.amount = amount;
        this.date = date;
        this.status = Status.PENDING.getValue(); // Default to "Pending"
        this.timestamp = java.time.Instant.now().toString(); // Auto-set timestamp
    }
}