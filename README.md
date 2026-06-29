# Eco Match

Eco Match is a sustainable waste management application that connects users with waste collection vendors and provides tools for waste classification and recycling.

## Features

- **Waste Collection Requests**: Users can request waste collection from vendors
- **Vendor Marketplace**: Browse and connect with waste collection vendors
- **Impact Tracking**: Track your environmental impact through waste diversion metrics
- **Rewards System**: Earn points and rewards for sustainable waste management
- **Waste Detection**: Identify and classify waste objects in images using AI

## New Feature: Waste Detection

The application now includes an AI-powered waste detection feature that can identify and classify waste objects in images. This feature helps users:

- Identify different types of waste materials
- Determine if items are recyclable
- Get proper disposal instructions
- Calculate sustainability metrics

For detailed information about the waste detection feature, see [README-WASTE-DETECTION.md](README-WASTE-DETECTION.md).

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Spring Boot
- **Database**: MongoDB
- **AI Model**: YOLOv8 for waste detection

## Getting Started

1. Clone the repository
2. Start the backend server:
   ```
   mvn spring:run
   ```
3. Start the frontend development server:
   ```
   npm install
   npm run dev
   ```
4. Start the waste detection model server (important for the waste detection feature to work):
   ```
   cd model
   ./check_and_start_model_server.sh
   ```
   This script will check if the model server is already running and start it if needed.

## Documentation

- [Waste Detection Documentation](README-WASTE-DETECTION.md)
