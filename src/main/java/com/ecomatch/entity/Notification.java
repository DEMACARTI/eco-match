package com.ecomatch.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
public class Notification {
    @Id
    private String id;
    private String userId;
    private String vendorId;
    private String message;
    private String type;
    private LocalDateTime timestamp;
    private boolean read;

    public Notification() {
        this.timestamp = LocalDateTime.now();
        this.read = false;
    }
}