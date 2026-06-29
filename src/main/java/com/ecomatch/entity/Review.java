package com.ecomatch.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reviews")
@Data
public class Review {
    @Id
    private String id;
    private String vendorId;
    private String userId;
    private int rating;
    private String comment;
    private String date;

    @Override
    public String toString() {
        return "Review{" +
               "id='" + id + '\'' +
               ", vendorId='" + vendorId + '\'' +
               ", userId='" + userId + '\'' +
               ", rating=" + rating +
               ", comment='" + comment + '\'' +
               ", date='" + date + '\'' +
               '}';
    }
}