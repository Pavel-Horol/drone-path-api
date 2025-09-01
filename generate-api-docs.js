#!/usr/bin/env node

/**
 * Automatic API Documentation Generator for Drone Routes Service
 * Generates comprehensive OpenAPI documentation from existing codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import project modules dynamically
const loadModule = async(modulePath) => {
  try {
    const fullPath = path.resolve(__dirname, modulePath);
    const module = await import(fullPath);
    return module.default || module;
  } catch (error) {
    console.warn(`Could not load ${modulePath}:`, error.message);
    return null;
  }
};

class ApiDocGenerator {
  constructor() {
    this.docs = {
      openapi: '3.0.0',
      info: {
        title: 'Drone Routes Service API',
        version: '1.0.0',
        description: 'MVP service for drone multispectral photo routes',
        contact: {
          name: 'Drone Routes Team'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {}
      },
      tags: []
    };

    this.basePath = '/api/v1';
  }

  async generate() {
    console.log('🔍 Analyzing codebase...');

    // Analyze routes
    await this.analyzeRoutes();

    // Analyze models
    await this.analyzeModels();

    // Analyze validations
    await this.analyzeValidations();

    // Generate examples and workflows
    this.generateExamples();

    return this.docs;
  }

  async analyzeRoutes() {
    console.log('📋 Analyzing route files...');

    const routesDir = path.join(__dirname, 'src/routes');
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

    for (const file of routeFiles) {
      const routePath = path.join(routesDir, file);
      const content = fs.readFileSync(routePath, 'utf8');

      await this.parseRouteFile(content, file);
    }
  }

  async parseRouteFile(_content, filename) {
    const resource = filename.replace('.route.js', '');
    const routes = [];

    // Extract router setup and routes
    const routerMatches = _content.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]*)['"]/g);

    if (routerMatches) {
      for (const match of routerMatches) {
        const [, method, path] = match.match(/router\.(\w+)\(['"]([^'"]*)['"]/);
        routes.push({ method: method.toUpperCase(), path, resource });
      }
    }

    // Analyze each route
    for (const route of routes) {
      await this.analyzeRoute(route, _content);
    }
  }

  async analyzeRoute(route, _content) {
    const { method, path, resource } = route;
    const fullPath = `${this.basePath}/${resource}${path}`;

    if (!this.docs.paths[fullPath]) {
      this.docs.paths[fullPath] = {};
    }

    // Load controller to understand the operation
    const controllerPath = `src/controllers/${resource}.controller.js`;
    // eslint-disable-next-line no-unused-vars
    const _controller = await loadModule(controllerPath);

    const operation = {
      tags: [resource],
      summary: this.generateSummary(method, path, resource),
      description: this.generateDescription(method, path, resource),
      parameters: [],
      responses: {}
    };

    // Add path parameters
    const pathParams = path.match(/:(\w+)/g);
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.slice(1);
        operation.parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${paramName} identifier`
        });
      }
    }

    // Add request body for POST/PUT
    if (['POST', 'PUT'].includes(method)) {
      operation.requestBody = this.generateRequestBody(resource, method);
    }

    // Add responses
    operation.responses = this.generateResponses(method, resource);

    this.docs.paths[fullPath][method.toLowerCase()] = operation;
  }

  generateSummary(method, path, resource) {
    const actions = {
      GET: path.includes(':id') ? 'Get' : 'List',
      POST: 'Create',
      PUT: 'Update',
      DELETE: 'Delete'
    };

    const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
    return `${actions[method]} ${resourceName}`;
  }

  generateDescription(method, path, resource) {
    const descriptions = {
      'GET /': `Retrieve a list of all ${resource}`,
      'GET /:id': `Retrieve details of a specific ${resource.slice(0, -1)}`,
      'POST /': `Create a new ${resource.slice(0, -1)}`,
      'PUT /:id': `Update an existing ${resource.slice(0, -1)}`,
      'DELETE /:id': `Delete a ${resource.slice(0, -1)}`
    };

    return descriptions[`${method} ${path}`] || `${method} operation on ${resource}`;
  }

  generateRequestBody(resource, method) {
    const schemas = {
      drones: {
        POST: 'CreateDroneRequest',
        PUT: 'UpdateDroneRequest'
      },
      routes: {
        POST: 'CreateRouteRequest'
      }
    };

    const schemaName = schemas[resource]?.[method];
    if (!schemaName) return undefined;

    return {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${schemaName}` }
        },
        'multipart/form-data': {
          schema: { $ref: `#/components/schemas/${schemaName}Multipart` }
        }
      }
    };
  }

  generateResponses(method, resource) {
    const responses = {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${resource}Response` }
          }
        }
      },
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${resource}Response` }
          }
        }
      },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    };

    if (method === 'POST') return { 201: responses[201], 400: responses[400], 500: responses[500] };
    if (method === 'DELETE') return { 200: { description: 'Deleted successfully' }, 404: responses[404], 500: responses[500] };
    return { 200: responses[200], 404: responses[404], 500: responses[500] };
  }

  async analyzeModels() {
    console.log('📊 Analyzing data models...');

    const modelsDir = path.join(__dirname, 'src/models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

    for (const file of modelFiles) {
      const modelPath = path.join(modelsDir, file);
      const content = fs.readFileSync(modelPath, 'utf8');

      this.parseModelFile(content, file);
    }
  }

  parseModelFile(content, filename) {
    const modelName = filename.replace('.model.js', '');
    const capitalizedModel = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    // Extract schema fields from Mongoose schema
    const schemaMatches = content.match(/(\w+):\s*{\s*type:\s*(\w+)/g);

    if (schemaMatches) {
      const properties = {};

      for (const match of schemaMatches) {
        const [, fieldName, fieldType] = match.match(/(\w+):\s*{\s*type:\s*(\w+)/);
        const typeMap = {
          String: 'string',
          Number: 'number',
          Boolean: 'boolean',
          Date: 'string',
          ObjectId: 'string'
        };

        properties[fieldName] = {
          type: typeMap[fieldType] || 'string',
          ...(fieldType === 'Date' && { format: 'date-time' })
        };
      }

      this.docs.components.schemas[capitalizedModel] = {
        type: 'object',
        properties
      };
    }
  }

  async analyzeValidations() {
    console.log('✅ Analyzing validation schemas...');

    const validationsDir = path.join(__dirname, 'src/validations');
    const validationFiles = fs.readdirSync(validationsDir).filter(f => f.endsWith('.js'));

    for (const file of validationFiles) {
      const validationPath = path.join(validationsDir, file);
      const content = fs.readFileSync(validationPath, 'utf8');

      this.parseValidationFile(content, file);
    }
  }

  parseValidationFile(content, filename) {
    const resource = filename.replace('.validation.js', '');

    // Extract Vine schema definitions
    const schemaMatches = content.match(/export const (\w+)Schema[\s\S]*?};/g);

    if (schemaMatches) {
      for (const match of schemaMatches) {
        const schemaNameMatch = match.match(/export const (\w+)Schema/);
        if (schemaNameMatch) {
          const schemaName = schemaNameMatch[1];
          const capitalizedResource = resource.charAt(0).toUpperCase() + resource.slice(1);

          // Create request schema
          this.docs.components.schemas[`${capitalizedResource}${schemaName}Request`] = {
            type: 'object',
            properties: this.extractSchemaProperties(match)
          };
        }
      }
    }
  }

  extractSchemaProperties(schemaContent) {
    const properties = {};
    const fieldMatches = schemaContent.match(/(\w+):\s*vine\.(\w+)\(\)/g);

    if (fieldMatches) {
      for (const match of fieldMatches) {
        const [, fieldName, validator] = match.match(/(\w+):\s*vine\.(\w+)\(\)/);
        const typeMap = {
          string: 'string',
          number: 'number'
        };

        properties[fieldName] = {
          type: typeMap[validator] || 'string'
        };
      }
    }

    return properties;
  }

  generateExamples() {
    console.log('📝 Generating examples and workflows...');

    // Add example responses
    this.docs.components.schemas.DroneResponse = {
      type: 'object',
      properties: {
        id: { type: 'string', example: '64f1a2b3c4d5e6f7g8h9i0j' },
        model: { type: 'string', example: 'DJI Mavic 3' },
        serialNumber: { type: 'string', example: 'DJI001234' },
        currentBatteryCharge: { type: 'number', example: 85 },
        totalFlightTime: { type: 'number', example: 120 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };

    this.docs.components.schemas.RouteResponse = {
      type: 'object',
      properties: {
        id: { type: 'string', example: '64f1a2b3c4d5e6f7g8h9i0k' },
        name: { type: 'string', example: 'Farm_Field_A_2024' },
        droneId: { type: 'string', example: '64f1a2b3c4d5e6f7g8h9i0j' },
        status: { type: 'string', enum: ['processing', 'complete', 'partial'], example: 'complete' },
        totalPoints: { type: 'number', example: 150 },
        pointsWithPhotos: { type: 'number', example: 150 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        points: {
          type: 'array',
          items: { $ref: '#/components/schemas/RoutePoint' }
        }
      }
    };

    this.docs.components.schemas.RoutePoint = {
      type: 'object',
      properties: {
        fileName: { type: 'string', example: 'IMG_001.jpg' },
        date: { type: 'string', example: '2024-01-15' },
        time: { type: 'string', example: '14:30:25' },
        latitude: { type: 'string', example: '40.7128' },
        longitude: { type: 'string', example: '-74.0060' },
        altitude: { type: 'string', example: '50.5' },
        speed: { type: 'string', example: '15.2' },
        course: { type: 'string', example: '90.0' },
        hasPhoto: { type: 'boolean', example: true },
        photoUrl: { type: 'string', example: 'https://minio.example.com/routes/64f1a2b3c4d5e6f7g8h9i0k/IMG_001.jpg' },
        sensorData: {
          type: 'object',
          properties: {
            mLux: { type: 'string', example: '45000' },
            rIr1: { type: 'string', example: '120' },
            gIr: { type: 'string', example: '135' },
            rIr2: { type: 'string', example: '118' }
          }
        }
      }
    };

    // Add multipart schemas for file uploads
    this.docs.components.schemas.CreateRouteRequestMultipart = {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Farm_Field_A_2024' },
        csv: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing GPS coordinates and sensor data'
        },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Array of photo files to associate with GPS points'
        }
      }
    };

    // Add tags for better organization
    this.docs.tags = [
      {
        name: 'drones',
        description: 'Drone management operations'
      },
      {
        name: 'routes',
        description: 'Flight route management with photo capture'
      }
    ];
  }

  async save(outputPath = 'api-documentation.json') {
    const output = JSON.stringify(this.docs, null, 2);
    fs.writeFileSync(outputPath, output);
    console.log(`📄 API documentation saved to: ${outputPath}`);

    // Also generate YAML version
    const yamlPath = outputPath.replace('.json', '.yaml');
    const yaml = this.convertToYaml(this.docs);
    fs.writeFileSync(yamlPath, yaml);
    console.log(`📄 YAML documentation saved to: ${yamlPath}`);
  }

  convertToYaml(obj) {
    // Simple YAML converter for basic structures
    const yamlify = (obj, indent = 0) => {
      const spaces = ' '.repeat(indent);
      let result = '';

      if (Array.isArray(obj)) {
        for (const item of obj) {
          result += `${spaces}- ${typeof item === 'object' ? '\n' + yamlify(item, indent + 2) : item}\n`;
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object') {
            result += `${spaces}${key}:\n${yamlify(value, indent + 2)}`;
          } else {
            result += `${spaces}${key}: ${value}\n`;
          }
        }
      } else {
        result += `${spaces}${obj}\n`;
      }

      return result;
    };

    return yamlify(obj);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting API Documentation Generation...\n');

  const generator = new ApiDocGenerator();

  try {
    // eslint-disable-next-line no-unused-vars
    const docs = await generator.generate();
    await generator.save();

    console.log('\n✅ API Documentation Generated Successfully!');
    console.log('\n📋 Generated Files:');
    console.log('  - api-documentation.json (OpenAPI 3.0 JSON)');
    console.log('  - api-documentation.yaml (OpenAPI 3.0 YAML)');
    console.log('\n🎯 Ready for AI Frontend Generation!');
    console.log('   Use these files with ChatGPT, Claude, or any AI tool to generate your frontend.');

  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ApiDocGenerator;
