export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "DokanBD API",
    version: "1.0.0",
    description:
      "Interactive documentation for the DokanBD Express, TypeScript and TypeORM API.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Health", description: "API and database health" },
    { name: "Authentication", description: "Registration, login and current user" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API and database health",
        responses: {
          "200": {
            description: "The API and database are available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a customer account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                name: "Test Customer",
                phone: "01700000001",
                email: "customer@example.com",
                password: "TestPass123",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Customer account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": { $ref: "#/components/responses/ConflictError" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in using an email address or phone number",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                identifier: "customer@example.com",
                password: "TestPass123",
              },
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
          "401": { $ref: "#/components/responses/AuthenticationError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Authenticated user returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/AuthenticationError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/InternalServerError" },
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
      Role: {
        type: "object",
        required: ["id", "code", "name"],
        properties: {
          id: { type: "string", example: "1" },
          code: { type: "string", example: "CUSTOMER" },
          name: { type: "string", example: "Customer" },
        },
      },
      User: {
        type: "object",
        required: ["id", "name", "phone", "isActive", "role", "createdAt"],
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "Test Customer" },
          email: {
            type: "string",
            format: "email",
            nullable: true,
            example: "customer@example.com",
          },
          phone: { type: "string", example: "01700000001" },
          isActive: { type: "boolean", example: true },
          role: { $ref: "#/components/schemas/Role" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "phone", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          phone: {
            type: "string",
            pattern: "^01[3-9][0-9]{8}$",
            example: "01700000001",
          },
          email: { type: "string", format: "email" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: {
            type: "string",
            description: "Registered email address or Bangladesh phone number",
          },
          password: { type: "string", format: "password", maxLength: 72 },
        },
      },
      UserResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["user"],
            properties: {
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
      LoginResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            required: ["accessToken", "tokenType", "expiresIn", "user"],
            properties: {
              accessToken: { type: "string", description: "JWT access token" },
              tokenType: { type: "string", example: "Bearer" },
              expiresIn: { type: "integer", example: 86400 },
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "message", "database"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "DokanBD API is running" },
          database: { type: "string", example: "connected" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "The request data is invalid." },
              details: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      AuthenticationError: {
        description: "Authentication failed or is required",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      ForbiddenError: {
        description: "The authenticated user cannot perform this action",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      ConflictError: {
        description: "A user with the phone number or email already exists",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFoundError: {
        description: "The requested resource was not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      InternalServerError: {
        description: "An unexpected server error occurred",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
} as const;
