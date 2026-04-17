# NearFix Backend API Documentation

## Overview
This document describes the currently implemented API in the NearFix backend.

- Runtime: Node.js + Express
- Database: MongoDB via Mongoose
- Auth: JWT Bearer Token
- Default port: `5021` (or `PORT` from environment)

## Base URL
Use one of the following depending on environment:

- Local: `http://localhost:5021`
- Remote: `https://<your-domain>`

All API routes are prefixed with `/api` except the health route.

## Authentication
Protected endpoints require a JWT access token in the `Authorization` header.

Header format:

```http
Authorization: Bearer <token>
```

Token is issued by:

- `POST /api/auth/login`

JWT payload currently contains:

- `userId` (string)
- `role` (`user` or `worker`)

## Environment Variables
Expected environment variables:

```env
PORT=5021
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<jwt-signing-secret>

CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

# Optional, should remain disabled in production
STORE_PLAINTEXT_PASSWORD=false
```

### Security Note
If `STORE_PLAINTEXT_PASSWORD=true` (or `1`), user plain-text password is stored in `originalPassword`. This is unsafe for production.

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "originalPassword": "string (optional, only if STORE_PLAINTEXT_PASSWORD is enabled)",
  "password": "string (bcrypt hash)",
  "role": "user | worker",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Worker
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "skill": "string",
  "price": "number",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "image": "string",
  "rating": "number (default: 0)",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Booking
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "workerId": "ObjectId",
  "status": "string (default: confirmed)",
  "createdAt": "ISO date"
}
```

## Endpoints

---

## 1. Health Check
### `GET /health`
Check whether API server is running.

#### Response `200`
```json
{
  "status": "ok"
}
```

---

## 2. Auth

### `POST /api/auth/register`
Create a new user account.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "strong-password",
  "role": "user"
}
```

#### Required Fields
- `name`
- `email`
- `password`

#### Optional Fields
- `role` (defaults to `user`, allowed: `user`, `worker`)

#### Success Response `201`
```json
{
  "userId": "665f9abca4f2f4d6870a1234",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

#### Error Responses
- `400` Missing required fields
```json
{ "message": "Name, email, and password are required." }
```
- `409` Email already registered
```json
{ "message": "Email is already registered." }
```
- `500` Server error
```json
{ "message": "Registration failed." }
```

#### Example cURL
```bash
curl -X POST http://localhost:5021/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "strong-password",
    "role": "worker"
  }'
```

---

### `POST /api/auth/login`
Authenticate a user and receive JWT token.

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "strong-password"
}
```

#### Required Fields
- `email`
- `password`

#### Success Response `200`
```json
{
  "token": "<jwt-token>"
}
```

#### Error Responses
- `400` Missing required fields
```json
{ "message": "Email and password are required." }
```
- `401` Invalid credentials
```json
{ "message": "Invalid credentials." }
```
- `500` Missing JWT secret/server misconfiguration
```json
{ "message": "Server misconfiguration." }
```
- `500` Generic failure
```json
{ "message": "Login failed." }
```

#### Example cURL
```bash
curl -X POST http://localhost:5021/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "strong-password"
  }'
```

---

## 3. Workers

### `POST /api/workers`
Create a worker profile.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "Alex Plumber",
  "skill": "Plumbing",
  "price": 499,
  "location": {
    "lat": 22.5726,
    "lng": 88.3639
  },
  "image": "https://res.cloudinary.com/<cloud>/image/upload/sample.jpg"
}
```

#### Required Fields
- `name`
- `skill`
- `price`
- `location.lat`
- `location.lng`
- `image`

#### Success Response `201`
Returns the created worker document.

```json
{
  "_id": "66601c9fa3ec16d95f831111",
  "userId": "665f9abca4f2f4d6870a1234",
  "name": "Alex Plumber",
  "skill": "Plumbing",
  "price": 499,
  "location": {
    "lat": 22.5726,
    "lng": 88.3639
  },
  "image": "https://res.cloudinary.com/<cloud>/image/upload/sample.jpg",
  "rating": 0,
  "createdAt": "2026-04-17T10:00:00.000Z",
  "updatedAt": "2026-04-17T10:00:00.000Z",
  "__v": 0
}
```

#### Error Responses
- `401` Missing/invalid token
```json
{ "message": "Authorization token missing." }
```
```json
{ "message": "Invalid or expired token." }
```
- `403` User not allowed by role check
```json
{ "message": "Forbidden." }
```
- `403` Non-worker trying to create worker profile (controller-level guard)
```json
{ "message": "Only workers can create a worker profile." }
```
- `400` Missing required fields
```json
{ "message": "Name, skill, price, location (lat/lng), and image are required." }
```
- `500` Server error
```json
{ "message": "Failed to create worker." }
```

#### Example cURL
```bash
curl -X POST http://localhost:5021/api/workers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Plumber",
    "skill": "Plumbing",
    "price": 499,
    "location": { "lat": 22.5726, "lng": 88.3639 },
    "image": "https://res.cloudinary.com/<cloud>/image/upload/sample.jpg"
  }'
```

---

### `GET /api/workers`
Get all workers.

#### Access
- Public route (no auth required)

#### Success Response `200`
```json
[
  {
    "_id": "66601c9fa3ec16d95f831111",
    "userId": "665f9abca4f2f4d6870a1234",
    "name": "Alex Plumber",
    "skill": "Plumbing",
    "price": 499,
    "location": { "lat": 22.5726, "lng": 88.3639 },
    "image": "https://res.cloudinary.com/<cloud>/image/upload/sample.jpg",
    "rating": 0,
    "createdAt": "2026-04-17T10:00:00.000Z",
    "updatedAt": "2026-04-17T10:00:00.000Z",
    "__v": 0
  }
]
```

#### Error Response
- `500` Server error
```json
{ "message": "Failed to fetch workers." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/workers
```

---

## 4. Bookings

### `POST /api/bookings`
Create a booking for the logged-in user.

#### Access
- Protected route: requires valid JWT

#### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Request Body
```json
{
  "workerId": "66601c9fa3ec16d95f831111"
}
```

#### Required Fields
- `workerId`

#### Behavior
- `userId` is taken from `req.user.userId`
- `status` defaults to `confirmed`

#### Success Response `201`
```json
{
  "message": "Booking created successfully."
}
```

#### Error Responses
- `401` Missing/invalid token or no authenticated user context
```json
{ "message": "Authorization token missing." }
```
```json
{ "message": "Invalid or expired token." }
```
```json
{ "message": "Unauthorized." }
```
- `400` Missing required field
```json
{ "message": "workerId is required." }
```
- `404` Worker not found
```json
{ "message": "Worker not found." }
```
- `500` Server error
```json
{ "message": "Failed to create booking." }
```

#### Example cURL
```bash
curl -X POST http://localhost:5021/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "66601c9fa3ec16d95f831111"
  }'
```

---

### `GET /api/bookings/my`
Get bookings of the logged-in user.

#### Access
- Protected route: requires valid JWT

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Success Response `200`
Returns a list of bookings for the logged-in user (sorted by newest first).

```json
[
  {
    "_id": "6660a8fca3ec16d95f832222",
    "userId": "665f9abca4f2f4d6870a1234",
    "workerId": "66601c9fa3ec16d95f831111",
    "status": "confirmed",
    "createdAt": "2026-04-17T12:00:00.000Z",
    "__v": 0
  }
]
```

#### Error Responses
- `401` Missing/invalid token or no authenticated user context
```json
{ "message": "Authorization token missing." }
```
```json
{ "message": "Invalid or expired token." }
```
```json
{ "message": "Unauthorized." }
```
- `500` Server error
```json
{ "message": "Failed to fetch bookings." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/bookings/my \
  -H "Authorization: Bearer <token>"
```

## Common Error Patterns
Across protected endpoints:

- Missing bearer token: `401 Authorization token missing.`
- Invalid/expired bearer token: `401 Invalid or expired token.`
- Auth role mismatch: `403 Forbidden.`

Across auth endpoints:

- Missing required payload: `400`
- Credential conflict/validation failure: `409` or `401`
- Unexpected server exception: `500`

## Current Behavior Notes

1. Worker image upload middleware exists (`multer` + Cloudinary), but worker creation currently expects an image URL string in JSON body.
2. JWT token does not currently include expiration (`exp`).
3. CORS is configured with `origin: "*"`.

## Suggested Next Improvements

1. Add token expiry and refresh token flow.
2. Add request validation library (for example `zod` or `joi`) for stricter input checking.
3. Use upload middleware in a dedicated route for image upload and persist returned secure URL.
4. Add pagination/filtering for `GET /api/workers`.
5. Add OpenAPI spec generation to keep docs and code in sync.
