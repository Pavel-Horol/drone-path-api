# Drone Path API - Authentication Guide

## Overview

The Drone Path API now includes user authentication with JWT tokens and role-based access control. Users can register accounts, login, and manage their own drones and routes.

## Authentication Endpoints

### Register a New User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe",
      "createdAt": "2025-01-27T19:39:23.000Z",
      "updatedAt": "2025-01-27T19:39:23.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "username": "john_doe",
      "createdAt": "2025-01-27T19:39:23.000Z",
      "updatedAt": "2025-01-27T19:39:23.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile
```
GET /api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
```

## Route Access Control

### Public Routes (No Authentication Required)
- `GET /api/v1/drones` - View all drones (or user's own if authenticated)
- `GET /api/v1/drones/:id` - View specific drone
- `GET /api/v1/routes` - View all routes (or user's own if authenticated)
- `GET /api/v1/routes/:id` - View specific route

### Protected Routes (Authentication Required)
- `POST /api/v1/drones` - Create a new drone
- `PUT /api/v1/drones/:id` - Update drone (only owner)
- `DELETE /api/v1/drones/:id` - Delete drone (only owner)
- `POST /api/v1/routes` - Create a new route
- `PUT /api/v1/routes/:id` - Update route (only owner)
- `DELETE /api/v1/routes/:id` - Delete route (only owner)
- `POST /api/v1/routes/:id/photos` - Upload photos to route (only owner)

## Using JWT Tokens

Include the JWT token in the Authorization header for protected routes:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Ownership Rules

- Users can only modify (update/delete) drones and routes they created
- When authenticated, users see only their own drones and routes
- When not authenticated, users see all public resources

## Example Usage

### 1. Register and Get Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "pilot1", "password": "password123"}'
```

### 2. Create a Drone (Protected)
```bash
curl -X POST http://localhost:3000/api/v1/drones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "model": "DJI Mavic",
    "serialNumber": "DJI001",
    "currentBatteryCharge": 85,
    "totalFlightTime": 120
  }'
```

### 3. Create a Route (Protected)
```bash
curl -X POST http://localhost:3000/api/v1/routes \
  -F "csv=@route_data.csv" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "name=My Route" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 7 days (configurable)
- Unique username constraint
- Foreign key constraints ensure data integrity
- Resource ownership validation
- SQL injection protection through parameterized queries

## Configuration

Set the following environment variables for production:

```bash
JWT_SECRET=your-super-secret-jwt-key-for-production
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/drone_routes
```

## Database Schema Changes

The following models have been updated to include user relationships:

### User Model
- `username`: Unique, required
- `password`: Hashed, required
- `createdAt/updatedAt`: Timestamps

### Drone Model
- Added `userId`: Reference to User model

### Route Model
- Added `userId`: Reference to User model

## Error Responses

### Authentication Errors
```json
{
  "status": "error",
  "message": "Access token is required"
}
```

### Authorization Errors
```json
{
  "status": "error",
  "message": "You don't have permission to modify this drone"
}
```

### Validation Errors
```json
{
  "status": "error",
  "message": "Username already exists"
}
