package com.ecomatch.controller;

import com.ecomatch.entity.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    @MessageMapping("/send/notification")
    @SendTo("/topic/notifications")
    public Notification broadcastNotification(Notification notification) {
        logger.info("Broadcasting notification: {}", notification);
        notification.setTimestamp(LocalDateTime.now());
        return notification;
    }
    
    // Method to send notification to a specific user
    public void sendNotificationToUser(String userId, String message, String type) {
        logger.info("Sending notification to user {}: {}", userId, message);
        
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setMessage(message);
        notification.setType(type);
        notification.setTimestamp(LocalDateTime.now());
        
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", notification);
    }
    
    // Method to send notification to a specific vendor
    public void sendNotificationToVendor(String vendorId, String message, String type) {
        logger.info("Sending notification to vendor {}: {}", vendorId, message);
        
        Notification notification = new Notification();
        notification.setVendorId(vendorId);
        notification.setMessage(message);
        notification.setType(type);
        notification.setTimestamp(LocalDateTime.now());
        
        messagingTemplate.convertAndSend("/topic/vendor/" + vendorId + "/notifications", notification);
    }
    
    // Method to send system-wide notification
    public void sendSystemNotification(String message) {
        logger.info("Sending system notification: {}", message);
        
        Map<String, Object> notification = new HashMap<>();
        notification.put("message", message);
        notification.put("type", "SYSTEM");
        notification.put("timestamp", LocalDateTime.now().toString());
        
        messagingTemplate.convertAndSend("/topic/system", notification);
    }
}