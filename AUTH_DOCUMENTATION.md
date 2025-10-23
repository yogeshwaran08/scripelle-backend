# Authentication System Documentation

## Overview

This is a complete JWT-based authentication system with PostgreSQL backend featuring:

- User registration and login
- Access tokens (JWT) sent in response body
- Refresh tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- Protected route middleware

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE scripelle_db;
```

### 2. Run Migration

Execute the migration file to create the users table:

```bash
psql -U postgres -d scripelle_db -f migrations/001_create_users_table.sql
```

Or connect to your database and run the SQL directly:

```bash
psql -U postgres -d scripelle_db
\i migrations/001_create_users_table.sql
```

## Environment Variables

Update your `.env` file with secure values:

```env
# IMPORTANT: Change these secrets in production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## API Endpoints

### Public Endpoints

#### 1. Register

**POST** `/auth/register`

Request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

Response (201):

```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-10-20T00:00:00.000Z"
  }
}
```

**Note:** Refresh token is automatically set in HTTP-only cookie.

---

#### 2. Login

**POST** `/auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response (200):

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-10-20T00:00:00.000Z"
  }
}
```

---

#### 3. Refresh Token

**POST** `/auth/refresh`

Request: No body needed (reads refresh token from cookie)

Response (200):

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

#### 4. Logout

**POST** `/auth/logout`

Request: No body needed

Response (200):

```json
{
  "message": "Logout successful"
}
```

**Note:** Clears the refresh token cookie.

---

### Protected Endpoints

#### 5. Get Current User

**GET** `/auth/me`

Headers:

```
Authorization: Bearer <access_token>
```

Response (200):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-10-20T00:00:00.000Z"
  }
}
```

---

## Usage in Your Application

### Integrating Auth Routes

In your main Express app file (e.g., `src/index.ts` or `src/App.ts`):

```typescript
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Required for refresh token cookies

// Routes
app.use("/auth", authRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Protecting Routes

Use the `authenticateToken` middleware to protect any route:

```typescript
import { Router } from "express";
import { authenticateToken } from "./middlewares/auth.middleware";

const router = Router();

// Protected route
router.get("/profile", authenticateToken, (req, res) => {
  // req.user is now available with { userId, email }
  res.json({ userId: req.user.userId, email: req.user.email });
});

export default router;
```

### Client-Side Implementation

#### Storing Access Token

```javascript
// After login/register
const { accessToken, user } = response.data;
localStorage.setItem("accessToken", accessToken);
```

#### Making Authenticated Requests

```javascript
const accessToken = localStorage.getItem("accessToken");

fetch("http://localhost:3000/auth/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  credentials: "include", // Important: sends cookies
});
```

#### Handling Token Expiration

```javascript
// When you get 403 (token expired), refresh it
async function refreshAccessToken() {
  const response = await fetch("http://localhost:3000/auth/refresh", {
    method: "POST",
    credentials: "include", // Sends refresh token cookie
  });

  if (response.ok) {
    const { accessToken } = await response.json();
    localStorage.setItem("accessToken", accessToken);
    return accessToken;
  }

  // Refresh failed, redirect to login
  window.location.href = "/login";
}
```

## Security Best Practices

1. **Change JWT Secrets**: Use strong, random secrets in production (min 32 characters)
2. **HTTPS in Production**: Set `secure: true` for cookies (already handled via NODE_ENV)
3. **Password Requirements**: Enforce strong passwords (min 6 chars in current implementation)
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Email Verification**: Consider adding email verification for production
6. **Token Rotation**: Current implementation generates new refresh tokens on each refresh

## Token Flow

```
Client                          Server
  |                               |
  |--- POST /auth/login --------->|
  |                               | Verify credentials
  |                               | Generate access + refresh tokens
  |<-- Access Token + Cookie -----|
  |    (refresh token in cookie)  |
  |                               |
  |--- GET /auth/me ------------->|
  |    (with access token)        | Verify access token
  |<-- User Data -----------------|
  |                               |
  |    (access token expires)     |
  |                               |
  |--- POST /auth/refresh ------->|
  |    (refresh cookie sent auto) | Verify refresh token
  |<-- New Access Token ----------|
  |                               |
  |--- POST /auth/logout -------->|
  |                               | Clear refresh cookie
  |<-- Success -------------------|
```

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Access Protected Route

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── Authentication.ts        # Auth controller (register, login, etc.)
│   ├── middlewares/
│   │   └── auth.middleware.ts       # JWT verification middleware
│   ├── routes/
│   │   └── auth.routes.ts           # Auth route definitions
│   ├── types/
│   │   └── auth.types.ts            # TypeScript interfaces
│   ├── utils/
│   │   └── auth.utils.ts            # JWT & bcrypt utilities
│   └── db/
│       └── index.ts                 # PostgreSQL connection
├── migrations/
│   └── 001_create_users_table.sql   # Database schema
└── .env                             # Environment variables
```

## Troubleshooting

### "Invalid or expired token" errors

- Access tokens expire in 15 minutes by default
- Use the refresh endpoint to get a new access token
- Ensure cookies are being sent with requests (`credentials: 'include'`)

### "User with this email already exists"

- Email must be unique in the database
- Check if user is already registered

### "Refresh token required"

- Ensure cookies are enabled and being sent
- Check that cookie-parser middleware is configured
- Verify `credentials: 'include'` in fetch requests

### Database connection errors

- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure database and table exist
