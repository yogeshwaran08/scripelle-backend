# Admin User Setup Guide

This guide explains how to create and use admin accounts in the system.

## 🔑 Admin Endpoints

### 1. Create Admin User

**Endpoint:** `POST /api/auth/admin/create`

Creates a new admin user with full admin privileges and beta access.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123",
  "firstName": "Admin",
  "lastName": "User",
  "adminSecret": "optional_secret_key"
}
```

**Response (201 Created):**
```json
{
  "message": "Admin user created successfully",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "plan": "free",
    "isAdmin": true,
    "availableCredits": 0,
    "betaMember": true,
    "status": "approved",
    "createdAt": "2025-11-10T..."
  }
}
```

**Features:**
- ✅ Automatically sets `isAdmin: true`
- ✅ Automatically sets `betaMember: true` and `status: approved`
- ✅ Adds email to beta access list
- ✅ Returns access token for immediate use
- ✅ Sets refresh token as HTTP-only cookie

**Error Responses:**

- **400 Bad Request** - Missing required fields or password too short
  ```json
  { "error": "Email, password, firstName, and lastName are required" }
  ```

- **403 Forbidden** - Invalid admin secret (if ADMIN_SECRET_KEY is set)
  ```json
  { "error": "Invalid admin secret key" }
  ```

- **409 Conflict** - Email already exists
  ```json
  { "error": "User with this email already exists" }
  ```

---`

### 2. Admin Login

**Endpoint:** `POST /api/auth/admin/login`

Login specifically for admin users. Only users with `isAdmin: true` can use this endpoint.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Admin login successful",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "plan": "free",
    "isAdmin": true,
    "availableCredits": 0,
    "betaMember": true,
    "status": "approved",
    "createdAt": "2025-11-10T..."
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing credentials
  ```json
  { "error": "Email and password are required" }
  ```

- **401 Unauthorized** - Invalid credentials
  ```json
  { "error": "Invalid credentials" }
  ```

- **403 Forbidden** - User is not an admin
  ```json
  { "error": "Access denied. Admin privileges required." }
  ```

---

## 🚀 Quick Start

### Option 1: Create Admin with Secret Key (Recommended for Production)

**Step 1:** Add admin secret to your `.env` file:
```env
ADMIN_SECRET_KEY=your_super_secret_key_here_change_this_in_production
```

**Step 2:** Create admin user with secret:
```bash
POST http://localhost:3000/api/auth/admin/create
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "StrongPassword123!",
  "firstName": "Admin",
  "lastName": "User",
  "adminSecret": "your_super_secret_key_here_change_this_in_production"
}
```

### Option 2: Create Admin without Secret (For Development)

If `ADMIN_SECRET_KEY` is not set in `.env`, you can create admins without the secret:

```bash
POST http://localhost:3000/api/auth/admin/create
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

⚠️ **Security Warning:** In production, always use the admin secret to prevent unauthorized admin creation.

---

## 📝 Usage Examples

### Using cURL

**Create Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Admin Login:**
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123"
  }'
```

### Using JavaScript/Fetch

**Create Admin:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/admin/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePass123',
    firstName: 'Admin',
    lastName: 'User',
    adminSecret: process.env.ADMIN_SECRET_KEY // Optional
  })
});

const data = await response.json();
console.log('Admin created:', data);

// Store the access token
const accessToken = data.accessToken;
```

**Admin Login:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
console.log('Admin logged in:', data);
```

---

## 🔐 Security Best Practices

### 1. **Use Strong Admin Secret**
```env
# Bad ❌
ADMIN_SECRET_KEY=123456

# Good ✅
ADMIN_SECRET_KEY=7f8a9b2c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5
```

Generate a secure secret:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. **Protect Admin Endpoints in Production**

Consider these additional security measures:

- **IP Whitelisting:** Only allow admin creation from specific IPs
- **Rate Limiting:** Limit admin creation attempts
- **Audit Logging:** Log all admin creation and login attempts
- **Two-Factor Authentication:** Add 2FA for admin accounts (future enhancement)

### 3. **Disable Admin Creation After Setup**

After creating your admin accounts, you can disable the creation endpoint by adding this check:

```typescript
// In Authentication.ts createAdmin function
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_CREATION) {
  return res.status(403).json({ 
    error: 'Admin creation is disabled in production' 
  });
}
```

Then in `.env`:
```env
ALLOW_ADMIN_CREATION=false
```

---

## 🎯 After Creating Admin

Once you've created an admin user, you can:

1. **Use Admin Routes:**
   ```bash
   # Add beta emails
   POST /api/admin/beta/add
   Authorization: Bearer YOUR_ACCESS_TOKEN
   
   # View waitlist
   GET /api/admin/beta/waitlist
   Authorization: Bearer YOUR_ACCESS_TOKEN
   
   # Approve users
   POST /api/admin/beta/approve/:userId
   Authorization: Bearer YOUR_ACCESS_TOKEN
   ```

2. **Manage Beta Access:**
   - Pre-approve emails before signup
   - Review and approve/reject waiting list users
   - View beta access statistics

3. **Full Documentation:**
   - See `BETA_ACCESS_DOCUMENTATION.md` for all admin endpoints
   - See `QUICK_START.md` for testing the beta system

---

## 🔄 Admin vs Regular Login

| Feature | Regular Login | Admin Login |
|---------|--------------|-------------|
| Endpoint | `/api/auth/login` | `/api/auth/admin/login` |
| Beta Check | ✅ Yes (blocks pending users) | ❌ No (admins bypass) |
| Admin Required | ❌ No | ✅ Yes |
| Returns `isAdmin` | ✅ Yes | ✅ Yes |
| Access to Admin Routes | ✅ If admin | ✅ Yes |

**Note:** Both endpoints work for admin users, but `/api/auth/admin/login` specifically requires admin privileges.

---

## 🧪 Testing

**Test Admin Creation:**
```bash
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "Admin"
  }'
```

**Test Admin Login:**
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@example.com",
    "password": "TestPass123"
  }'
```

**Test Admin Routes:**
```bash
# Save the access token from login
TOKEN="your_access_token_here"

# Test admin endpoint
curl -X GET http://localhost:3000/api/admin/beta/waitlist \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/admin/create` | POST | None (Secret Key) | Create admin user |
| `/api/auth/admin/login` | POST | None | Admin-only login |
| `/api/auth/login` | POST | None | Regular login (works for admins too) |

**Admin users automatically get:**
- ✅ `isAdmin: true`
- ✅ `betaMember: true`
- ✅ `status: "approved"`
- ✅ Access to all `/api/admin/*` routes
- ✅ No beta approval required

---

## 🆘 Troubleshooting

**Problem:** "Invalid admin secret key"
- **Solution:** Make sure `ADMIN_SECRET_KEY` in `.env` matches the `adminSecret` in your request

**Problem:** "User with this email already exists"
- **Solution:** Use a different email or update the existing user in the database

**Problem:** "Access denied. Admin privileges required."
- **Solution:** Use `/api/auth/admin/create` to create an admin account first, or set `is_admin = true` in the database

**Problem:** Can't access admin routes even after admin login
- **Solution:** Make sure you're sending the Bearer token in the Authorization header

---

## 🎊 Ready to Use!

You now have full admin functionality:
1. Create admin users via API
2. Login with admin credentials
3. Access all admin routes
4. Manage the beta program

See `BETA_ACCESS_DOCUMENTATION.md` for complete admin route documentation.
