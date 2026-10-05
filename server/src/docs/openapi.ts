import type { JsonObject } from "swagger-ui-express";

export const openApiDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "DokanBD API",
    version: "1.0.0",
    description: "REST API documentation for the DokanBD e-commerce platform.",
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "API and database health" },
    { name: "Authentication", description: "Customer authentication" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API and database health",
        responses: {
          "200": {
            description: "API and database are available",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "DokanBD API is running" },
                    database: { type: "string", example: "connected" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a customer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Customer registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": { $ref: "#/components/responses/ConflictError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in with phone or email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the authenticated customer",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated customer",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "phone", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100, example: "Test Customer" },
          phone: { type: "string", pattern: "^01[3-9][0-9]{8}$", example: "01700000002" },
          email: { type: "string", format: "email", example: "customer2@example.com" },
          password: { type: "string", format: "password", minLength: 8, maxLength: 72, writeOnly: true, example: "TestPass123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: { type: "string", example: "01700000001" },
          password: { type: "string", format: "password", writeOnly: true, example: "TestPass123" },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          code: { type: "string", example: "CUSTOMER" },
          name: { type: "string", example: "Customer" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "Test Customer" },
          email: { type: "string", format: "email", nullable: true, example: "customer@example.com" },
          phone: { type: "string", example: "01700000001" },
          isActive: { type: "boolean", example: true },
          role: { $ref: "#/components/schemas/Role" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", description: "JWT access token" },
              tokenType: { type: "string", example: "Bearer" },
              expiresIn: { type: "integer", example: 86400 },
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Invalid request data",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      UnauthorizedError: {
        description: "Authentication failed",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      ConflictError: {
        description: "Phone or email is already registered",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFoundError: {
        description: "User not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
};
