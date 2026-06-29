package com.ecomatch.controller;

import com.ecomatch.entity.User;
import com.ecomatch.repository.UserRepository;
import com.ecomatch.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public AuthController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        logger.info("Login attempt for user: {}", credentials.get("email"));
        
        if (credentials.get("email") == null || credentials.get("email").isEmpty()) {
            logger.error("Login failed: Email is required");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        
        // Simple authentication based on email (in a real app, would check password too)
        User user = userRepository.findById(credentials.get("email"))
                .orElse(null);
        
        if (user == null) {
            logger.warn("User not found with email: {}", credentials.get("email"));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        
        logger.info("User logged in successfully: {}", user.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        logger.info("Registration attempt for user: {}", user.getEmail());
        
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            logger.error("Registration failed: Email is required");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        
        if (user.getName() == null || user.getName().isEmpty()) {
            logger.error("Registration failed: Name is required");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        
        // Set the ID to be the email for simplicity
        user.setId(user.getEmail());
        
        // Check if user already exists
        if (userRepository.existsById(user.getId())) {
            logger.error("Registration failed: User already exists with email: {}", user.getEmail());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists with this email");
        }
        
        User savedUser = userService.saveUser(user);
        logger.info("User registered successfully: {}", savedUser.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @GetMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // In a real application, this would invalidate the session or token
        logger.info("User logged out");
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        
        return ResponseEntity.ok(response);
    }
}