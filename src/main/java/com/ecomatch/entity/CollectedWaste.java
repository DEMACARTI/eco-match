package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "collected_waste")
public class CollectedWaste {
    @Id
    private String id;
    private String vendorId;
    private String pickupId;
    private String type;   // Waste type (e.g., "Plastic", "Paper")
    private double amount; // Amount collected in kg
    private String date;   // Date of collection
    private String status; // e.g., "Collected", "Processed"

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }
    public String getPickupId() { return pickupId; }
    public void setPickupId(String pickupId) { this.pickupId = pickupId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "CollectedWaste{" +
               "id='" + id + '\'' +
               ", vendorId='" + vendorId + '\'' +
               ", pickupId='" + pickupId + '\'' +
               ", type='" + type + '\'' +
               ", amount=" + amount +
               ", date='" + date + '\'' +
               ", status='" + status + '\'' +
               '}';
    }
}