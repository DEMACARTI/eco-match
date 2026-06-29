package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "processed_waste")
public class ProcessedWaste {
    @Id
    private String id;
    private String vendorId;
    private String type;
    private double amount;
    private double pricing;
    private double revenue;
    private String dateProcessed;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getPricing() { return pricing; }
    public void setPricing(double pricing) { this.pricing = pricing; }
    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }
    public String getDateProcessed() { return dateProcessed; }
    public void setDateProcessed(String dateProcessed) { this.dateProcessed = dateProcessed; }
}