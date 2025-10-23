# ✅ User Schema Updated Successfully!

## 📋 What Changed

Your User model has been updated with the requested fields!

---

## 🗄️ New User Schema

### **Prisma Model** (`prisma/schema.prisma`):

```prisma
model User {
  id               Int      @id @default(autoincrement())
  email            String   @unique
  password         String
  firstName        String   @map("first_name")
  lastName         String   @map("last_name")
  plan             String   @default("free")
  availableCredits Int      @default(0) @map("available_credits")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

###

**Fields:**

| Field              | Type     | Default        | Description           |
| ------------------ | -------- | -------------- | --------------------- |
| `id`               | Int      | Auto-increment | Primary key           |
| `email`            | String   | Required       | Unique email address  |
| `password`         | String   | Required       | Hashed password       |
| `firstName`        | String   | Required       | User's first name     |
| `lastName`         | String   | Required       | User's last name      |
| `plan`             | String   | `"free"`       | Subscription plan     |
| `availableCredits` | Int      | `0`            | Available credits     |
| `createdAt`        | DateTime | Now            | Creation timestamp    |
| `updatedAt`        | DateTime | Auto           | Last update timestamp |

---

## 📝 API Changes

### **Register Endpoint** - Updated

**Before:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**After:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "plan": "premium" // Optional, defaults to "free"
}
```

### **Response Format** - Updated

```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "plan": "premium",
    "availableCredits": 0,
    "createdAt": "2025-10-19T19:49:00.000Z"
  }
}
```

---

## 🔄 Migration Applied

✅ **Migration Name:** `add_user_fields`

**What happened:**

1. Renamed `name` field to `firstName` and `lastName`
2. Added `plan` field (default: "free")
3. Added `availableCredits` field (default: 0)
4. Migrated existing user data (split name into firstName/lastName)

---

## 🧪 Testing

### **Test Registration:**

```powershell
# Run the test script
.\test-auth.ps1
```

Or manually with curl:

```powershell
curl -X POST http://localhost:5000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123","firstName":"John","lastName":"Doe","plan":"premium"}'
```

### **Test Login:**

```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'
```

### **Test Get User (Protected):**

```powershell
$token = "YOUR_ACCESS_TOKEN_HERE"
curl -X GET http://localhost:5000/api/v1/auth/me `
  -H "Authorization: Bearer $token"
```

---

## 📊 Database Schema

**Table:** `users`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    plan VARCHAR(255) NOT NULL DEFAULT 'free',
    available_credits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💡 Usage Examples

### **Register with Default Plan:**

```typescript
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    password: hashedPassword,
    firstName: "John",
    lastName: "Doe",
    // plan defaults to "free"
    // availableCredits defaults to 0
  },
});
```

### **Register with Premium Plan:**

```typescript
const user = await prisma.user.create({
  data: {
    email: "premium@example.com",
    password: hashedPassword,
    firstName: "Jane",
    lastName: "Smith",
    plan: "premium",
  },
});
```

### **Update Credits:**

```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: {
    availableCredits: {
      increment: 100, // Add 100 credits
    },
  },
});
```

### **Change Plan:**

```typescript
const updated = await prisma.user.update({
  where: { email: "user@example.com" },
  data: {
    plan: "enterprise",
    availableCredits: 1000,
  },
});
```

### **Query by Plan:**

```typescript
const premiumUsers = await prisma.user.findMany({
  where: {
    plan: "premium",
  },
});
```

### **Get Users with Low Credits:**

```typescript
const lowCreditUsers = await prisma.user.findMany({
  where: {
    availableCredits: {
      lt: 10, // Less than 10 credits
    },
  },
});
```

---

## 🎯 Plan Types (Suggested)

You can use any string for `plan`, but here are some common examples:

- `"free"` - Free tier (default)
- `"basic"` - Basic paid plan
- `"premium"` - Premium plan
- `"pro"` - Professional plan
- `"enterprise"` - Enterprise plan

---

## 🔧 Next Steps

### 1. **Add Plan Validation**

You might want to validate plan values:

```typescript
// In your controller
const validPlans = ["free", "basic", "premium", "pro", "enterprise"];
if (plan && !validPlans.includes(plan)) {
  res.status(400).json({ error: "Invalid plan type" });
  return;
}
```

### 2. **Add Credit Management Endpoints**

Create endpoints to manage credits:

```typescript
// Add credits
POST /api/v1/users/:id/credits/add
{ "amount": 100 }

// Deduct credits
POST /api/v1/users/:id/credits/deduct
{ "amount": 50 }

// Get credit balance
GET /api/v1/users/:id/credits
```

### 3. **Add Plan Upgrade Endpoint**

```typescript
// Upgrade plan
POST /api/v1/users/:id/upgrade
{ "plan": "premium" }
```

---

## 📁 Updated Files

✅ `prisma/schema.prisma` - User model updated  
✅ `src/types/auth.types.ts` - TypeScript interfaces updated  
✅ `src/controllers/Authentication.ts` - All endpoints updated  
✅ `prisma/migrations/` - New migration created and applied  
✅ `test-auth.ps1` - Test script created

---

## ✅ Summary

Your user schema now includes:

- ✅ **firstName** and **lastName** (instead of single name field)
- ✅ **plan** field with default value "free"
- ✅ **availableCredits** field with default value 0
- ✅ All existing data migrated successfully
- ✅ All authentication endpoints updated
- ✅ TypeScript types updated for type safety

---

## 🎉 You're All Set!

Your authentication system now supports:

- First and last names separately
- User subscription plans
- Credit system for usage tracking

**Test it now:**

```powershell
npm run dev
.\test-auth.ps1
```

Happy coding! 🚀
