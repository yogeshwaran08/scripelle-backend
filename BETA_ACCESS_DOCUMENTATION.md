# Early Access (Beta) Program Implementation

This document describes the implementation of an Early Access (Beta) program for the authentication system.

## Overview

The system now supports a beta access program where:
- Admins can pre-approve emails for beta access
- Users can sign up and be placed on a waiting list if not pre-approved
- Admins can approve/reject users from the waiting list
- Only approved users can fully access the system

## Database Schema Changes

### User Model Additions
```prisma
model User {
  // ... existing fields
  isAdmin          Boolean   @default(false)
  betaMember       Boolean   @default(false)
  status           String    @default("pending") // "pending" | "approved" | "rejected"
}
```

### New BetaAccessList Model
```prisma
model BetaAccessList {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  approved  Boolean  @default(true)
  addedBy   String   // admin ID or name
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### Admin Routes (Protected - Requires Admin Access)

All admin routes require:
1. Valid JWT token (Bearer token in Authorization header)
2. User must have `isAdmin: true`

Base path: `/api/admin/beta`

#### 1. Add Email to Beta Access List
```http
POST /api/admin/beta/add
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (201 Created):**
```json
{
  "message": "Email added to beta access list successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "approved": true,
    "addedBy": "123",
    "createdAt": "2025-11-10T..."
  }
}
```

**Behavior:**
- Adds email to beta access list
- If a user with this email already exists and is pending, automatically approves them
- If email already exists in the list, updates it to approved

#### 2. Approve User from Waiting List
```http
POST /api/admin/beta/approve/:userId
Authorization: Bearer <admin_token>
```

**Example:**
```http
POST /api/admin/beta/approve/123
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "User approved successfully",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "betaMember": true,
    "status": "approved"
  }
}
```

**Behavior:**
- Sets user's `betaMember` to `true` and `status` to `"approved"`
- Adds email to beta access list
- User can now login and access the system

#### 3. Reject User from Waiting List
```http
POST /api/admin/beta/reject/:userId
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "User rejected successfully",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "betaMember": false,
    "status": "rejected"
  }
}
```

#### 4. Get Waiting List
```http
GET /api/admin/beta/waitlist
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "Waitlist retrieved successfully",
  "count": 5,
  "data": [
    {
      "id": 123,
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "pending",
      "betaMember": false,
      "createdAt": "2025-11-10T..."
    }
  ]
}
```

**Behavior:**
- Returns all users with `status: "pending"` and `betaMember: false`
- Sorted by creation date (oldest first - first-come, first-served)

#### 5. Get Beta Access List
```http
GET /api/admin/beta/list
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "Beta access list retrieved successfully",
  "count": 10,
  "data": [
    {
      "id": 1,
      "email": "approved@example.com",
      "approved": true,
      "addedBy": "123",
      "createdAt": "2025-11-10T...",
      "updatedAt": "2025-11-10T..."
    }
  ]
}
```

#### 6. Remove Email from Beta Access List
```http
DELETE /api/admin/beta/remove/:email
Authorization: Bearer <admin_token>
```

**Example:**
```http
DELETE /api/admin/beta/remove/user@example.com
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "message": "Email removed from beta access list successfully",
  "email": "user@example.com"
}
```

### User Authentication Changes

#### Modified Signup Flow
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Case 1: Pre-Approved Email (201 Created)**
```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "plan": "free",
    "availableCredits": 0,
    "betaMember": true,
    "status": "approved",
    "createdAt": "2025-11-10T..."
  }
}
```

**Case 2: Not Pre-Approved (201 Created - Waiting List)**
```json
{
  "message": "You're added to the waiting list. We'll notify you when approved.",
  "waitingList": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "pending",
    "betaMember": false
  }
}
```

#### Modified Login Flow
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Case 1: Approved User (200 OK)**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "plan": "free",
    "availableCredits": 0,
    "betaMember": true,
    "status": "approved",
    "createdAt": "2025-11-10T..."
  }
}
```

**Case 2: Pending User (403 Forbidden)**
```json
{
  "error": "Your account is pending approval. You're on the waiting list. We'll notify you when approved.",
  "waitingList": true,
  "status": "pending"
}
```

**Case 3: Rejected User (403 Forbidden)**
```json
{
  "error": "Your beta access request has been rejected.",
  "status": "rejected"
}
```

## Implementation Files

### New Files
1. **`src/controllers/AdminController.ts`** - Admin functions for beta management
2. **`src/routes/admin.routes.ts`** - Admin API endpoints

### Modified Files
1. **`prisma/schema.prisma`** - Database schema with beta fields
2. **`src/controllers/Authentication.ts`** - Updated signup and login logic
3. **`src/middlewares/auth.middleware.ts`** - Added `requireAdmin` middleware
4. **`src/types/auth.types.ts`** - Added beta-related types
5. **`src/routes/index.ts`** - Registered admin routes

## Setup Instructions

### 1. Apply Database Migration

The migration has already been created and applied:
```bash
npx prisma migrate dev --name add_beta_access_system
```

### 2. Regenerate Prisma Client

**IMPORTANT**: Close any running development servers before running:
```bash
npx prisma generate
```

If you encounter file permission errors on Windows:
1. Stop all Node.js processes
2. Close VS Code
3. Run the command again

### 3. Create First Admin User

You'll need to manually set a user as admin in the database:

**Option 1: Using Prisma Studio**
```bash
npx prisma studio
```
Then:
1. Open the Users table
2. Find your user
3. Set `isAdmin` to `true`

**Option 2: Using SQL**
```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

**Option 3: Using Prisma in Node.js**
```typescript
await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { isAdmin: true }
});
```

## Usage Workflow

### Admin Workflow

#### Pre-Approve Beta Users (Recommended)
1. Admin adds approved emails to beta list:
   ```bash
   POST /api/admin/beta/add
   { "email": "vip@example.com" }
   ```

2. When these users sign up, they automatically get approved

#### Manage Waiting List
1. Admin checks waiting list:
   ```bash
   GET /api/admin/beta/waitlist
   ```

2. Admin approves specific users:
   ```bash
   POST /api/admin/beta/approve/123
   ```

3. Or rejects users:
   ```bash
   POST /api/admin/beta/reject/123
   ```

### User Workflow

#### Scenario 1: Pre-Approved Email
1. User signs up → Immediately approved
2. User receives access token
3. User can login and use the system

#### Scenario 2: Not Pre-Approved
1. User signs up → Added to waiting list
2. User receives "waiting list" message
3. User tries to login → Receives "pending approval" message
4. Admin approves user
5. User can now login successfully

## Security Considerations

1. **Admin Protection**: All admin routes require:
   - Valid JWT authentication
   - `isAdmin: true` flag on user account

2. **Error Responses**: Use generic error messages to avoid exposing system details

3. **Email Validation**: Email format is validated before adding to beta list

4. **Status Checks**: Login is prevented for pending/rejected users

## Optional Enhancements

### Email Notifications

You can extend the `EmailService` to send notifications:

```typescript
// In src/services/email.service.ts

export class EmailService {
  static async sendBetaApprovalEmail(email: string) {
    // Implement email notification for beta approval
    const subject = 'Welcome to Beta Access!';
    const html = `
      <h1>Congratulations!</h1>
      <p>Your beta access request has been approved.</p>
      <p>You can now log in and start using the platform.</p>
    `;
    
    // Use your email sending logic
  }
  
  static async sendWaitlistEmail(email: string) {
    // Implement email notification for waiting list
    const subject = 'You\'re on the Waiting List';
    const html = `
      <h1>Thanks for signing up!</h1>
      <p>You've been added to our waiting list.</p>
      <p>We'll notify you when your access is approved.</p>
    `;
    
    // Use your email sending logic
  }
}
```

Then uncomment the email sending code in:
- `AdminController.ts` (in `addBetaEmail` and `approveUser`)
- `Authentication.ts` (in `register`)

## Testing

### Test Admin Routes

```bash
# 1. Login as admin
POST /api/auth/login
{ "email": "admin@example.com", "password": "password" }

# Save the accessToken

# 2. Add beta email
POST /api/admin/beta/add
Authorization: Bearer <accessToken>
{ "email": "test@example.com" }

# 3. Check beta list
GET /api/admin/beta/list
Authorization: Bearer <accessToken>

# 4. Sign up with non-approved email
POST /api/auth/register
{ 
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}

# 5. Check waiting list
GET /api/admin/beta/waitlist
Authorization: Bearer <accessToken>

# 6. Approve the user (use the userId from step 4)
POST /api/admin/beta/approve/123
Authorization: Bearer <accessToken>

# 7. Login as approved user
POST /api/auth/login
{ "email": "newuser@example.com", "password": "password123" }
```

## Troubleshooting

### Prisma Client Errors

If you see TypeScript errors about missing properties:
1. Make sure the migration was applied: `npx prisma migrate dev`
2. Regenerate the Prisma client: `npx prisma generate`
3. Restart your TypeScript server (in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")

### Permission Denied on Windows

If `npx prisma generate` fails with EPERM:
1. Stop all Node.js processes
2. Close your code editor
3. Delete `node_modules/.prisma` folder
4. Run `npx prisma generate` again

### Admin Access Issues

If you can't access admin routes:
1. Verify your user has `isAdmin: true` in the database
2. Check you're sending the Bearer token correctly
3. Ensure the token hasn't expired (generate a new one by logging in)

## API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/beta/add` | Admin | Add email to beta list |
| POST | `/api/admin/beta/approve/:userId` | Admin | Approve waiting list user |
| POST | `/api/admin/beta/reject/:userId` | Admin | Reject waiting list user |
| GET | `/api/admin/beta/waitlist` | Admin | Get all pending users |
| GET | `/api/admin/beta/list` | Admin | Get beta access list |
| DELETE | `/api/admin/beta/remove/:email` | Admin | Remove email from list |
| POST | `/api/auth/register` | Public | Register (with beta check) |
| POST | `/api/auth/login` | Public | Login (with beta check) |

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | User registered but not approved (waiting list) |
| `approved` | User has beta access and can login |
| `rejected` | User's beta request was rejected |

