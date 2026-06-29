package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "requests")
public class Request {
    @Id
    private String id;
    private String userId;
    private String vendorId;
    private String wasteType;
    private double amount;
    private double earnings;
    private String status;
    private String date; // Format: "yyyy-MM-dd HH:mm"
    private String timestamp;
    private String notes;
    private Boolean recurring; // Added for recurring pickup support
    private String frequency;  // Added to specify recurring frequency (e.g., "Weekly", "Monthly")
    private String pickupId;   // Added to link with Pickup entity

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }
    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getEarnings() { return earnings; }
    public void setEarnings(double earnings) { this.earnings = earnings; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getRecurring() { return recurring; }
    public void setRecurring(Boolean recurring) { this.recurring = recurring; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getPickupId() { return pickupId; }
    public void setPickupId(String pickupId) { this.pickupId = pickupId; }

    @Override
    public String toString() {
        return "Request{" +
               "id='" + id + '\'' +
               ", userId='" + userId + '\'' +
               ", vendorId='" + vendorId + '\'' +
               ", wasteType='" + wasteType + '\'' +
               ", amount=" + amount +
               ", earnings=" + earnings +
               ", status='" + status + '\'' +
               ", date='" + date + '\'' +
               ", timestamp='" + timestamp + '\'' +
               ", notes='" + notes + '\'' +
               ", recurring=" + recurring +
               ", frequency='" + frequency + '\'' +
               ", pickupId='" + pickupId + '\'' +
               '}';
    }
}