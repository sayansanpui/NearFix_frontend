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
  "availability": "boolean (default: true)",
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
  "seenByWorker": "boolean (default: false)",
  "createdAt": "ISO date"
}
```

### Message
```json
{
  "_id": "ObjectId",
  "senderId": "ObjectId",
  "receiverId": "ObjectId",
  "bookingId": "ObjectId",
  "text": "string",
  "isRead": "boolean (default: false)",
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
  "availability": true,
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
    "availability": true,
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

### `GET /api/workers/me`
Get the logged-in worker's own profile.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Behavior
- Uses `req.user.userId` to fetch only the authenticated worker's own profile

#### Success Response `200`
Returns the worker profile document.

```json
{
  "_id": "66601c9fa3ec16d95f831111",
  "userId": "665f9abca4f2f4d6870a1234",
  "name": "Alex Plumber",
  "skill": "Plumbing",
  "price": 499,
  "location": { "lat": 22.5726, "lng": 88.3639 },
  "image": "https://res.cloudinary.com/<cloud>/image/upload/sample.jpg",
  "availability": true,
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
- `403` Role/owner guard failure
```json
{ "message": "Forbidden." }
```
```json
{ "message": "Only workers can view their profile." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to fetch worker profile." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/workers/me \
  -H "Authorization: Bearer <token>"
```

---

### `PATCH /api/workers/me`
Update the logged-in worker's own profile.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Accepted Fields
- `name`
- `skill`
- `price`
- `location.lat`
- `location.lng`
- `image`

#### Behavior
- Uses `req.user.userId` to enforce owner check
- Returns updated worker profile

#### Request Body (partial update)
```json
{
  "name": "Alex Master Plumber",
  "price": 599,
  "location": {
    "lat": 22.58,
    "lng": 88.37
  },
  "image": "https://res.cloudinary.com/<cloud>/image/upload/new-image.jpg"
}
```

#### Success Response `200`
```json
{
  "message": "Worker profile updated successfully.",
  "worker": {
    "_id": "66601c9fa3ec16d95f831111",
    "userId": "665f9abca4f2f4d6870a1234",
    "name": "Alex Master Plumber",
    "skill": "Plumbing",
    "price": 599,
    "location": {
      "lat": 22.58,
      "lng": 88.37
    },
    "image": "https://res.cloudinary.com/<cloud>/image/upload/new-image.jpg",
    "availability": true,
    "rating": 0,
    "createdAt": "2026-04-17T10:00:00.000Z",
    "updatedAt": "2026-04-18T09:30:00.000Z",
    "__v": 0
  }
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
- `403` Role/owner guard failure
```json
{ "message": "Forbidden." }
```
```json
{ "message": "Only workers can update their profile." }
```
- `400` Validation errors
```json
{ "message": "name must be a non-empty string." }
```
```json
{ "message": "skill must be a non-empty string." }
```
```json
{ "message": "price must be a valid number." }
```
```json
{ "message": "location must be an object." }
```
```json
{ "message": "location.lat must be a valid number." }
```
```json
{ "message": "location.lng must be a valid number." }
```
```json
{ "message": "image must be a non-empty string." }
```
```json
{ "message": "Unsupported fields: foo. Allowed fields: name, skill, price, location, image." }
```
```json
{ "message": "Unsupported location fields: altitude. Allowed fields: lat, lng." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to update worker profile." }
```

#### Example cURL
```bash
curl -X PATCH http://localhost:5021/api/workers/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Master Plumber",
    "price": 599,
    "location": { "lat": 22.58, "lng": 88.37 },
    "image": "https://res.cloudinary.com/<cloud>/image/upload/new-image.jpg"
  }'
```

---

### `DELETE /api/workers/me`
Delete the logged-in worker's own profile.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Behavior
- Uses `req.user.userId` to delete only the authenticated worker's own profile

#### Success Response `200`
```json
{
  "message": "Worker profile deleted successfully."
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
- `403` Role/owner guard failure
```json
{ "message": "Forbidden." }
```
```json
{ "message": "Only workers can delete their profile." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to delete worker profile." }
```

#### Example cURL
```bash
curl -X DELETE http://localhost:5021/api/workers/me \
  -H "Authorization: Bearer <token>"
```

---

### `PATCH /api/workers/availability`
Toggle availability of the logged-in worker profile (`true` <-> `false`).

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Request Body
No request body required.

#### Behavior
- Finds worker profile using `req.user.userId`
- Flips current `availability` value and saves

#### Success Response `200`
```json
{
  "message": "Availability updated successfully.",
  "availability": false,
  "worker": {
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
    "availability": false,
    "rating": 0,
    "createdAt": "2026-04-17T10:00:00.000Z",
    "updatedAt": "2026-04-17T10:30:00.000Z",
    "__v": 0
  }
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
- `403` Non-worker trying to update availability (controller-level guard)
```json
{ "message": "Only workers can update availability." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to update availability." }
```

#### Example cURL
```bash
curl -X PATCH http://localhost:5021/api/workers/availability \
  -H "Authorization: Bearer <token>"
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
- `seenByWorker` defaults to `false`

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
- `400` Invalid worker id
```json
{ "message": "Invalid workerId." }
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

---

### `GET /api/bookings/worker`
Get bookings assigned to the logged-in worker.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Success Response `200`
Returns bookings (newest first) with customer and worker summary.

```json
[
  {
    "bookingId": "6660a8fca3ec16d95f832222",
    "status": "confirmed",
    "createdAt": "2026-04-17T12:00:00.000Z",
    "user": {
      "id": "665f9abca4f2f4d6870a1234",
      "name": "John Doe"
    },
    "worker": {
      "id": "66601c9fa3ec16d95f831111",
      "name": "Alex Plumber",
      "userId": "665f9abca4f2f4d6870a5678"
    }
  }
]
```

#### Side Effect
- Marks fetched worker bookings as seen for booking-notification badge tracking.

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
- `403` User not allowed by role check
```json
{ "message": "Forbidden." }
```
- `403` Non-worker trying to access worker bookings (controller-level guard)
```json
{ "message": "Only workers can access worker bookings." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to fetch worker bookings." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/bookings/worker \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/bookings/worker-notification-count`
Get unseen booking-notification count for the logged-in worker.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Success Response `200`
```json
{
  "unseenBookingCount": 2
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
- `403` User not allowed by role check
```json
{ "message": "Forbidden." }
```
- `403` Non-worker trying to access booking notifications (controller-level guard)
```json
{ "message": "Only workers can access booking notifications." }
```
- `404` Worker profile not found
```json
{ "message": "Worker profile not found." }
```
- `500` Server error
```json
{ "message": "Failed to fetch booking notifications." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/bookings/worker-notification-count \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/bookings/:bookingId/participants`
Get booking participants and computed `receiverId` for the current authenticated user.

#### Access
- Protected route: requires valid JWT
- Participant-only: only the booking user or booking worker can access

#### Path Params
- `bookingId`

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Success Response `200`
```json
{
  "bookingId": "6660a8fca3ec16d95f832222",
  "user": {
    "id": "665f9abca4f2f4d6870a1234",
    "name": "John Doe"
  },
  "worker": {
    "id": "66601c9fa3ec16d95f831111",
    "name": "Alex Plumber",
    "userId": "665f9abca4f2f4d6870a5678"
  },
  "receiverId": "665f9abca4f2f4d6870a5678"
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
- `400` Invalid booking id
```json
{ "message": "Invalid bookingId." }
```
- `403` Authenticated user is not a booking participant
```json
{ "message": "Forbidden." }
```
- `404` Booking not found
```json
{ "message": "Booking not found." }
```
- `500` Server error
```json
{ "message": "Failed to fetch booking participants." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/bookings/6660a8fca3ec16d95f832222/participants \
  -H "Authorization: Bearer <token>"
```

---

## 5. Messages

### `POST /api/messages`
Send a message from the logged-in user.

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
  "receiverId": "665f9abca4f2f4d6870a5678",
  "bookingId": "6660a8fca3ec16d95f832222",
  "text": "I will reach in 20 minutes."
}
```

#### Required Fields
- `receiverId`
- `bookingId`
- `text`

#### Behavior
- `senderId` is taken from `req.user.userId`
- Sender must be a booking participant
- `receiverId` must be the other booking participant

#### Success Response `201`
Returns the created message document.

```json
{
  "_id": "6661b9fca3ec16d95f833333",
  "senderId": "665f9abca4f2f4d6870a1234",
  "receiverId": "665f9abca4f2f4d6870a5678",
  "bookingId": "6660a8fca3ec16d95f832222",
  "text": "I will reach in 20 minutes.",
  "isRead": false,
  "createdAt": "2026-04-17T14:30:00.000Z",
  "__v": 0
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
- `400` Missing required fields
```json
{ "message": "receiverId, bookingId, and text are required." }
```
- `400` Invalid booking id
```json
{ "message": "Invalid bookingId." }
```
- `400` Invalid receiver id
```json
{ "message": "Invalid receiverId." }
```
- `400` Invalid receiver for booking
```json
{ "message": "receiverId must be the other booking participant." }
```
- `403` Authenticated user is not a booking participant
```json
{ "message": "Forbidden." }
```
- `404` Booking not found
```json
{ "message": "Booking not found." }
```
- `500` Server error
```json
{ "message": "Failed to send message." }
```

#### Example cURL
```bash
curl -X POST http://localhost:5021/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "665f9abca4f2f4d6870a5678",
    "bookingId": "6660a8fca3ec16d95f832222",
    "text": "I will reach in 20 minutes."
  }'
```

---

### `GET /api/messages/unread-count`
Get unread message count for worker inbox badge polling.

#### Access
- Protected route: requires valid JWT
- Role-restricted: only users with role `worker` can access

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Success Response `200`
```json
{
  "unreadCount": 3
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
- `403` User not allowed by role check
```json
{ "message": "Forbidden." }
```
- `500` Server error
```json
{ "message": "Failed to fetch unread count." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/messages/unread-count \
  -H "Authorization: Bearer <token>"
```

---

### `GET /api/messages/:bookingId`
Get all messages for a booking sorted by `createdAt` (oldest first).

#### Access
- Protected route: requires valid JWT
- Participant-only: only the booking user or booking worker can access

#### Path Params
- `bookingId`

#### Headers
```http
Authorization: Bearer <jwt-token>
```

#### Behavior
- Returns messages sorted by `createdAt` in ascending order
- Marks messages as read where `receiverId` is current authenticated user
- For a valid booking with zero messages, returns `200` with `[]`

#### Success Response `200`
Returns a list of messages sorted by `createdAt` in ascending order.

```json
[
  {
    "_id": "6661b9fca3ec16d95f833333",
    "senderId": "665f9abca4f2f4d6870a1234",
    "receiverId": "665f9abca4f2f4d6870a5678",
    "bookingId": "6660a8fca3ec16d95f832222",
    "text": "I will reach in 20 minutes.",
    "isRead": true,
    "createdAt": "2026-04-17T14:30:00.000Z",
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
- `400` Invalid booking id
```json
{ "message": "Invalid bookingId." }
```
- `403` Authenticated user is not a booking participant
```json
{ "message": "Forbidden." }
```
- `404` Booking not found
```json
{ "message": "Booking not found." }
```
- `500` Server error
```json
{ "message": "Failed to fetch messages." }
```

#### Example cURL
```bash
curl http://localhost:5021/api/messages/6660a8fca3ec16d95f832222 \
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
