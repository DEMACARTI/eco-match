package com.ecomatch.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "pickups")
public class Pickup {
    @Id
    private String id;
    private String vendorId;
    private String userId; // Added field
    private String requestId;
    private String status;
    private String date;
    private String time;
    private String address;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    @Override
    public String toString() {
        return "Pickup{" +
               "id='" + id + '\'' +
               ", vendorId='" + vendorId + '\'' +
               ", userId='" + userId + '\'' + // Updated toString
               ", requestId='" + requestId + '\'' +
               ", status='" + status + '\'' +
               ", date='" + date + '\'' +
               ", time='" + time + '\'' +
               ", address='" + address + '\'' +
               '}';
    }
}