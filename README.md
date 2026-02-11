# TODO API — Production-ready Backend

This repository contains a production-ready, secure RESTful backend for a TODO application built with Node.js, Express and MongoDB. It was implemented to satisfy a technical assignment for an interview and demonstrates industry-standard security, session management, and clean architecture.

## Project Overview

This service exposes authenticated REST APIs for creating, reading, updating and deleting TODO items. Each TODO belongs to an authenticated user; all operations are scoped to the requesting user's id to prevent IDOR.

Key features:

- JWT-based authentication with short-lived Access Tokens and long-lived Refresh Tokens.
- Refresh Tokens stored as secure, HttpOnly cookies; Access Tokens returned in JSON responses.
- Password hashing using bcrypt with a salt factor of 12.
- Input validation and sanitization using Zod.
- IDOR protection by scoping DB queries to `user` field.
- Rate limiting, Helmet security headers, and CORS configuration.
- Clean layered architecture: Routes -> Controllers -> Models -> Utils.

## Tech Stack & Reasoning

- Node.js + Express: lightweight, fast, and well-suited for REST APIs and async IO.
- MongoDB + Mongoose: flexible schema for TODO apps; Mongoose provides modeling & validations.
- JWT: stateless access tokens with refresh token session management.
- bcrypt.js: proven password hashing with salts.
- Zod: strict request validation & sanitization to avoid NoSQL injection and malformed data.
- Helmet & express-rate-limit: security hardening.

These choices balance simplicity, security and speed of development while remaining production-ready.

## Repository Structure

- `app.js` — Express app configuration & middleware
- `server.js` — Bootstraps the server and DB connection
- `controller/` — Route handlers (auth + todos + errors)
- `models/` — Mongoose models (`userModel.js`, `todoModel.js`)
- `routes/` — Express routers
- `utils/` — helpers (APIFeatures, appError, validation, etc.)

## Requirements Covered

This implementation satisfies the assignment requirements:

- Secure authentication & session management (access + refresh tokens).
- CRUD TODO endpoints scoped per-user.
- Password hashing, environment-based secrets, input validation, and IDOR protection.
- Proper HTTP status codes and layered architecture.

## Environment Variables

Create a `config.env` file in the repository root with the following variables (example):

```env
NODE_ENV=development
PORT=8080
DATABASE=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/todo-app?retryWrites=true&w=majority

# Access Token (Short-lived)
JWT_SECRET=your_ultra_long_random_access_secret
JWT_EXPIRES_IN=15m

# Refresh Token (Long-lived)
JWT_REFRESH_SECRET=your_ultra_long_random_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_COOKIE_EXPIRES_IN=7
```

## Installation & Run (Local)

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
# development
npm start

# or with nodemon
npm run dev
```

3. The server listens on `http://localhost:PORT`.

## Authentication Flow

- Signup/Login: `POST /api/v1/users/signup` and `POST /api/v1/users/login`.
  - On success the server returns an `accessToken` in the JSON response and sets a `refreshToken` in a secure, HttpOnly cookie.
- Protected endpoints: include `Authorization: Bearer <accessToken>` header.
- When the access token expires, call `GET /api/v1/users/refresh` — the server will read the refresh cookie, validate it, and issue a new access token.
- Logout: `POST /api/v1/users/logout` clears the cookie and invalidates the refresh token server-side.

Security rationale:

- Refresh tokens in HttpOnly cookies reduce XSS exposure.
- Access tokens returned in JSON and sent in Authorization header avoid CSRF risks.
- Refresh tokens stored in the user document allow immediate revocation on logout.

## API Endpoints (Summary)

Authentication

- `POST /api/v1/users/signup` — Register a new user. Body: `{ name, email, password }`.
- `POST /api/v1/users/login` — Login. Body: `{ email, password }`. Response: `accessToken` + refresh cookie.
- `GET /api/v1/users/refresh` — Exchange refresh cookie for a new access token.
- `POST /api/v1/users/logout` — Log out and invalidate session.

TODO Management (Authenticated)

- `POST /api/v1/todos` — Create a TODO. Body: `{ title, description?, status? }`.
- `GET /api/v1/todos` — Get all TODOs for the logged-in user. Supports pagination & filtering.
- `GET /api/v1/todos/:id` — Get a single TODO (scoped to requesting user).
- `PATCH /api/v1/todos/:id` — Partial update (scoped to requesting user).
- `DELETE /api/v1/todos/:id` — Delete a TODO (scoped to requesting user).

Notes:

- All TODO queries are executed using the logged-in user's id, e.g. `Todo.findOne({ _id: id, user: req.user.id })` to prevent IDOR.
- Fields: `id`, `title`, `description`, `status` (pending|completed), `created_at`, `updated_at`.

## Validation

- Request bodies are validated using Zod schemas in `utils/schemas.js` and middleware in `utils/validate.js`.
- This prevents NoSQL injection and enforces types/shape before Mongoose sees the data.

## Security Hardening

- Password hashing: `bcrypt` with saltRounds = 12.
- Rate limiting: `express-rate-limit` applied on auth endpoints to mitigate brute-force.
- Helmet: secure HTTP headers.
- CORS: configured to allow trusted origins only (see `app.js`).
- Input validation with Zod.

## Database Design

- `User` model: stores `name`, `email` (unique), `password` (hashed), and `refreshToken` (single active refresh token per user for session invalidation).
- `Todo` model: stores `title`, `description`, `status`, `user` (ObjectId ref to User), `created_at`, `updated_at`.

Relationship: One User -> Many Todos; todos always reference their owner.

## Design Decisions & Assumptions

- Hybrid token placement: Access Token in response body + Refresh Token in HttpOnly cookie balances XSS/CSRF concerns.
- Server-side refresh token stored in DB enables session invalidation (logout).
- All DB queries for resources owned by users are explicitly scoped to the `user` field for IDOR protection.
- Zod used as first-line defense; Mongoose validations are secondary.
