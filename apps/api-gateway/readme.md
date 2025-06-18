# API Gateway Service

The API Gateway acts as the single entry point for all client requests into the microservice ecosystem. It is responsible for routing requests to the appropriate backend service, applying cross-cutting concerns like authentication, rate limiting, caching, and circuit breaking, and providing a unified API interface.

## Features

- **Request Routing:** Dynamically routes incoming HTTP/REST requests to various backend microservice based on configured prefixes and versions.
- **Authentication:** Verifies JWT tokens (placeholder provided) for authenticated requests.
- **Rate Limiting:** Protects backend service from abuse by limiting the number of requests from clients.
- **Circuit Breaker:** Implements a circuit breaker pattern to prevent cascading failures to unhealthy backend service.
- **Caching:** Caches responses for read-heavy endpoints to improve performance and reduce backend load.
- **Security Headers:** Uses `helmet` to set various HTTP headers for security.
- **Data Sanitization:** Protects against XSS and NoSQL injection attacks.
- **Compression:** Gzip compression for responses.
- **CORS:** Configurable Cross-Origin Resource Sharing.
- **Centralized Logging:** Integrates with `@libs/logger` for consistent logging.
- **Robust Error Handling:** Standardized error responses and detailed logging for unhandled exceptions.

## Folder Structure

api-gateway/
├── src/
│ ├── config/ # Application configurations (main, logger, service)
│ │ ├── config.js
│ │ ├── logger.js
│ │ └── service.js # Defines backend service, their routes, and policies
│ ├── controllers/ # Handles the core proxying logic
│ │ └── gateway.controller.js
│ ├── middleware/ # Express middlewares for cross-cutting concerns
│ │ ├── authentication.middleware.js
│ │ ├── cache.middleware.js
│ │ ├── circuit-breaker.middleware.js
│ │ ├── error-handler.middleware.js
│ │ ├── rate-limit.middleware.js
│ │ └── request-logger.middleware.js
│ ├── routes/ # Defines API Gateway routes and their handlers
│ │ ├── auth.routes.js
│ │ ├── notification.routes.js
│ │ ├── product.routes.js
│ │ ├── logging.routes.js
│ │ └── index.js # Main router combining all service routes
│ └── index.js # Main Express application entry point
├── Dockerfile # Docker build instructions
├── package.json # Project dependencies and scripts
└── .env.example # Example environment variables

## Configuration

- **`.env.example`**: Copy to `.env` and configure environment variables for service URLs, ports, and logging levels.
- **`src/config/service.js`**: This is the core configuration for defining your backend service, their API prefixes, supported versions, and the policies (middleware, rate limits, timeouts, circuit breakers, caching) to apply to each route.

## API Endpoints (Examples)

All requests to backend service are routed through the API Gateway.

- `GET /` : API Gateway health check.
- `POST /auth/v1/register` : Routes to User Service v1 for user registration.
- `POST /auth/v1/login` : Routes to User Service v1 for user login.
- `GET /auth/v1/users/me` : Routes to User Service v1 to fetch current user profile (requires authentication).
- `POST /notify/v1/email` : Routes to Notification Service v1 to queue an email.
- `GET /products/v1/item/{id}` : Routes to Product Service v1 to fetch product details (might be cached).
- `POST /logs/v1/ingest` : Routes to Logging Service v1 to ingest logs.

## Development

1.  **Install dependencies:** `npm install` in the `api-gateway` directory.
2.  **Run locally:** `npm run dev` (uses nodemon for auto-restarts).
3.  **Run with Docker Compose:** From the project root, `docker compose -f infra/docker/development/docker-compose.yml up api-gateway`.

## Testing

Basic unit tests for middleware and controller logic are recommended. For integration testing, use tools like Postman or `curl` against the gateway endpoints while all service are running via Docker Compose.

**Example `curl` commands (from project root after `docker compose up`):**

- **Gateway Health:** `curl http://localhost/`
- **Auth (Unauthorized):** `curl -v http://localhost/auth/v1/users/me`
- **Auth (Authorized - requires `valid-jwt-token` in `authentication.middleware.js`):**
  `curl -H "Authorization: Bearer valid-jwt-token" http://localhost/auth/v1/users/me`
- **Notification:**
  `curl -X POST -H "Content-Type: application/json" -d '{"to_email": "test@example.com", "subject": "Test", "body": "Hello"}' http://localhost/notify/v1/email`
- **Product:** `curl http://localhost/products/v1/item/123`
- **Log Ingest:**
  `curl -X POST -H "Content-Type: application/json" -d '{"service": "test", "level": "info", "message": "Test log"}' http://localhost/logs/v1/ingest`
