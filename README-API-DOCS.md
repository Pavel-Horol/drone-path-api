# 🚁 Drone Routes Service - API Documentation for AI Frontend Generation

## 📋 Overview

This repository contains **automatically generated API documentation** for the Drone Routes Service - an MVP system for managing drone multispectral photo routes. The documentation is specifically formatted for AI tools to generate complete frontend applications.

## 🎯 Perfect For AI Frontend Generation

This documentation is designed to be fed directly into AI tools like:
- **ChatGPT** with GPT-4
- **Claude** by Anthropic
- **GitHub Copilot**
- **Cursor** or other AI-assisted development tools

## 📁 Generated Files

### Core Documentation Files
- **`api-documentation.json`** - OpenAPI 3.0 specification (JSON format)
- **`api-documentation.yaml`** - OpenAPI 3.0 specification (YAML format)
- **`generate-api-docs.js`** - Automatic documentation generator script

### Additional Resources
- **`README-API-DOCS.md`** - This comprehensive guide
- **`package.json`** - Project dependencies and scripts

## 🔧 API Architecture

### Base URL
```
http://localhost:3000/api/v1
```

### Core Resources

#### 🛸 **Drones** (`/drones`)
Manage drone fleet and assignments
- **Create** new drones with specifications
- **List** all drones with status
- **Update** drone information and battery levels
- **Delete** drones (with route dependency checks)
- **Assign** drones to specific routes

#### 🛤️ **Routes** (`/routes`)
Handle flight path management with photo capture
- **Create** routes from CSV coordinates + photos
- **Upload** missing photos for existing routes
- **Retrieve** route details with GPS points and photos
- **List** all routes with completion status

## 📊 Data Models

### Drone Model
```json
{
  "id": "64f1a2b3c4d5e6f7g8h9i0j",
  "model": "DJI Mavic 3",
  "serialNumber": "DJI001234",
  "currentBatteryCharge": 85,
  "totalFlightTime": 120,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z"
}
```

### Route Model
```json
{
  "id": "64f1a2b3c4d5e6f7g8h9i0k",
  "name": "Farm_Field_A_2024",
  "droneId": "64f1a2b3c4d5e6f7g8h9i0j",
  "status": "complete",
  "totalPoints": 150,
  "pointsWithPhotos": 150,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z",
  "points": [...]
}
```

### Route Point (GPS + Sensor Data)
```json
{
  "fileName": "IMG_001.jpg",
  "date": "2024-01-15",
  "time": "14:30:25",
  "latitude": "40.7128",
  "longitude": "-74.0060",
  "altitude": "50.5",
  "speed": "15.2",
  "course": "90.0",
  "hasPhoto": true,
  "photoUrl": "https://minio.example.com/routes/.../IMG_001.jpg",
  "sensorData": {
    "mLux": "45000",
    "rIr1": "120",
    "gIr": "135",
    "rIr2": "118"
  }
}
```

## 🚀 API Endpoints

### Drones API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/drones` | Create new drone |
| `GET` | `/api/v1/drones` | List all drones |
| `GET` | `/api/v1/drones/:id` | Get drone details |
| `PUT` | `/api/v1/drones/:id` | Update drone |
| `DELETE` | `/api/v1/drones/:id` | Delete drone |
| `POST` | `/api/v1/drones/:droneId/assign-route/:routeId` | Assign drone to route |

### Routes API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/routes` | Create route with CSV + photos |
| `POST` | `/api/v1/routes/:id/photos` | Upload missing photos |
| `GET` | `/api/v1/routes/:id` | Get route details |
| `GET` | `/api/v1/routes` | List all routes |

## 📤 File Upload Specifications

### CSV Format for Routes
```csv
fileName,date,time,timeStatus,aex,latitude,longitude,speed,course,magn,altitude,spp,srr,mLux,rIr1,gIr,rIr2,iIr,iBright,shutter,gain,photoUrl,hasPhoto
IMG_001.tif,2024-01-15,14:30:25,,0.8,40.7128,-74.0060,15.2,90.0,0.0,50.5,2.1,1.8,45000,120,135,118,110,28000,1/250,8.0,,false
IMG_002.tif,2024-01-15,14:30:30,,0.8,40.7130,-74.0062,15.1,89.5,0.0,50.8,2.0,1.7,45100,121,136,119,111,28100,1/250,8.0,,false
```

### Photo Upload
- **Format**: JPEG, PNG, TIF
- **Naming**: Must match CSV `fileName` column
- **Size Limit**: 100MB per file
- **Multiple Files**: Up to 1000 photos per upload

## 🎨 Frontend Application Ideas

Based on this API, here are some frontend application concepts the AI could generate:

### 1. **Drone Fleet Management Dashboard**
- Real-time drone status monitoring
- Battery level visualizations
- Route assignment interface
- Flight history tracking

### 2. **Route Planning & Visualization**
- Interactive map with GPS coordinates
- Photo gallery with sensor data overlay
- Route completion status tracking
- CSV upload with validation

### 3. **Field Operations Mobile App**
- Offline route viewing
- Photo capture coordination
- Real-time status updates
- Sync with cloud storage

### 4. **Analytics & Reporting Portal**
- Route performance metrics
- Sensor data analysis
- Photo quality assessment
- Export capabilities

## 🤖 AI Generation Prompts

### For ChatGPT/GPT-4:
```
"Generate a complete React frontend application for a drone routes management system using this OpenAPI specification. Include:

1. Modern React with TypeScript
2. Responsive dashboard layout
3. Interactive maps for route visualization
4. File upload components for CSV and photos
5. Real-time status updates
6. Error handling and loading states
7. Clean, professional UI with Tailwind CSS

Use the attached api-documentation.json as the API specification."
```

### For Claude:
```
"Create a comprehensive drone management web application using the provided OpenAPI specification. Focus on:

- Vue.js 3 with Composition API
- Pinia for state management
- Vue Router for navigation
- Axios for API calls
- Interactive route mapping
- File upload handling
- Real-time data updates

The API documentation is in the attached JSON file."
```

## 🔄 Regenerating Documentation

To update the documentation when your API changes:

```bash
# Regenerate documentation from current codebase
node generate-api-docs.js

# This will update:
# - api-documentation.json
# - api-documentation.yaml
```

## 🏗️ Technology Stack

### Backend (Already Implemented)
- **Node.js** with Express
- **MongoDB** with Mongoose
- **MinIO** for file storage
- **Multer** for file uploads
- **JWT** authentication (if needed)
- **Advanced error handling**

### Suggested Frontend Stack
- **Vue.js** with TypeScript
- **Tailwind CSS** or **Material-UI** for styling
- **React Query** or **SWR** for data fetching
- **Leaflet** or **Mapbox** for maps
- **React Dropzone** for file uploads

## 📋 Business Logic Context

### Route Status Flow
1. **Processing**: Route created, waiting for photos
2. **Partial**: Some photos uploaded, incomplete
3. **Complete**: All photos uploaded and processed

### Drone-Route Assignment
- One drone can be assigned to multiple routes
- Routes can be reassigned between drones
- Deletion protection if drone has associated routes

### File Management
- Photos stored in MinIO with route-specific buckets
- Automatic URL generation for photo access
- CSV parsing with sensor data extraction

## 🎯 Next Steps

1. **Feed the API docs** to your preferred AI tool
2. **Specify your frontend requirements** (framework, features, design)
3. **Review and refine** the generated code
4. **Integrate with the backend** using the provided endpoints
5. **Test the complete application** end-to-end

## 📞 Support

This documentation was automatically generated from the Drone Routes Service codebase. For questions about the API or to request specific frontend features, refer to the generated OpenAPI specification files.

---

**Generated on**: January 15, 2024
**API Version**: 1.0.0
**Documentation Format**: OpenAPI 3.0
