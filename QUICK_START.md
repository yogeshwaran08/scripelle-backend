# 🚀 Quick Start Guide - Authentication System

## ✅ What's Been Set Up

Your authentication system is now fully configured with:

- ✓ JWT access tokens (sent in response body)
- ✓ Refresh tokens (stored in HTTP-only cookies)
- ✓ Password hashing with bcrypt
- ✓ PostgreSQL database integration
- ✓ TypeScript types and middleware
- ✓ All routes integrated into your Express app

## 📋 Next Steps

### 1. Set Up Database

Make sure PostgreSQL is running, then run the setup script:

```powershell
npm run setup-db
```

Or manually with ts-node:

```powershell
npx ts-node src/setup-db.ts
```

This will create:

- `users` table with proper schema
- Email index for faster lookups
- Auto-update triggers for `updated_at` field

### 2. Update JWT Secrets (IMPORTANT!)

Open `.env` and change these to secure random strings:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
```

**Generate secure secrets:**

```powershell
# Generate random secret in PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3. Start Your Server

```powershell
npm run dev
```

Your server should start on `http://localhost:5000`

### 4. Test the Authentication

All auth endpoints are available at: `http://localhost:5000/api/v1/auth/`

#### Register a new user:

```powershell
curl -X POST http://localhost:5000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

#### Login:

```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'
```

Copy the `accessToken` from the response.

#### Get current user (protected route):

```powershell
curl -X GET http://localhost:5000/api/v1/auth/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── Authentication.ts        ✅ Auth endpoints (register, login, etc.)
│   ├── middlewares/
│   │   └── auth.middleware.ts       ✅ JWT verification middleware
│   ├── routes/
│   │   ├── auth.routes.ts           ✅ Auth route definitions
│   │   └── index.ts                 ✅ Updated with auth routes
│   ├── types/
│   │   └── auth.types.ts            ✅ TypeScript interfaces
│   ├── utils/
│   │   └── auth.utils.ts            ✅ JWT & bcrypt utilities
│   ├── db/
│   │   └── index.ts                 ✅ PostgreSQL connection
│   ├── setup-db.ts                  ✅ Database setup script
│   └── App.ts                       ✅ Already configured
├── migrations/
│   └── 001_create_users_table.sql   ✅ SQL migration file
├── .env                             ✅ Environment variables
├── AUTH_DOCUMENTATION.md            ✅ Full documentation
└── QUICK_START.md                   ✅ This file
```

## 🔒 Available Endpoints

| Method | Endpoint                | Description          | Auth Required |
| ------ | ----------------------- | -------------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register new user    | No            |
| POST   | `/api/v1/auth/login`    | Login user           | No            |
| POST   | `/api/v1/auth/refresh`  | Refresh access token | Cookie        |
| POST   | `/api/v1/auth/logout`   | Logout user          | No            |
| GET    | `/api/v1/auth/me`       | Get current user     | Yes           |

## 🛡️ Protecting Your Routes

To protect any route, add the `authenticateToken` middleware:

```typescript
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Protected route
router.get("/profile", authenticateToken, (req, res) => {
  // req.user contains { userId, email }
  res.json({
    message: "This is protected!",
    user: req.user,
  });
});

export default router;
```

## 🌐 Frontend Integration

### Storing the Access Token

```javascript
// After login/register
const response = await fetch("http://localhost:5000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important for cookies
  body: JSON.stringify({ email, password }),
});

const data = await response.json();
localStorage.setItem("accessToken", data.accessToken);
```

### Making Authenticated Requests

```javascript
const accessToken = localStorage.getItem("accessToken");

const response = await fetch("http://localhost:5000/api/v1/auth/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  credentials: "include",
});
```

### Handling Token Refresh

```javascript
async function refreshToken() {
  const response = await fetch("http://localhost:5000/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  }

  // Refresh failed - redirect to login
  window.location.href = "/login";
}

// Use when you get 403 response
if (response.status === 403) {
  await refreshToken();
  // Retry the original request
}
```

## 🔧 Troubleshooting

### "Cannot find module 'pg'"

```powershell
npm install pg @types/pg
```

### "Cannot find module 'jsonwebtoken'"

```powershell
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

### Database connection errors

1. Check PostgreSQL is running
2. Verify `.env` credentials match your database
3. Make sure database exists: `CREATE DATABASE scripelle_db;`

### TypeScript errors

```powershell
npm run build
```

## 📖 Full Documentation

See `AUTH_DOCUMENTATION.md` for:

- Complete API reference
- Security best practices
- Advanced usage examples
- cURL testing examples

## 🎉 You're All Set!

Your authentication system is ready to use. Happy coding!
