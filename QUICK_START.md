# 🚀 Quick Start Guide - Beta Access System

## ⚡ 3-Step Setup

### Step 1: Fix TypeScript Errors (2 minutes)

**Close VS Code**, then run in PowerShell:

```powershell
cd f:\Projects\My_Works\Collge_erp\Scripelle_project\backend

# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove old Prisma client
Remove-Item -Path ".\node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Regenerate Prisma client
npx prisma generate
```

**Or use the helper script:**
```powershell
.\regenerate-prisma.ps1
```

### Step 2: Create Admin User (1 minute)

Open Prisma Studio:
```bash
npm run prisma:studio
```

1. Click on `users` table
2. Find your user
3. Set `is_admin` = ✅ `true`
4. Click Save

### Step 3: Test It (2 minutes)

Run the test script:
```bash
npx ts-node test-beta-system.ts
```

You should see:
```
✅ Beta Access System is properly configured!
```

## 🎯 Ready to Use!

Start your server:
```bash
npm run dev
```

### Test the API:

**1. Login as admin:**
```bash
POST http://localhost:YOUR_PORT/api/auth/login
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**2. Add beta email:**
```bash
POST http://localhost:YOUR_PORT/api/admin/beta/add
Authorization: Bearer YOUR_TOKEN
{
  "email": "vip@example.com"
}
```

**3. Sign up with pre-approved email:**
```bash
POST http://localhost:YOUR_PORT/api/auth/register
{
  "email": "vip@example.com",
  "password": "password123",
  "firstName": "VIP",
  "lastName": "User"
}
```
✅ **Result:** Instant access!

**4. Sign up without pre-approval:**
```bash
POST http://localhost:YOUR_PORT/api/auth/register
{
  "email": "newbie@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}
```
⏳ **Result:** Added to waiting list

**5. View waiting list:**
```bash
GET http://localhost:YOUR_PORT/api/admin/beta/waitlist
Authorization: Bearer YOUR_TOKEN
```

**6. Approve the user:**
```bash
POST http://localhost:YOUR_PORT/api/admin/beta/approve/USER_ID
Authorization: Bearer YOUR_TOKEN
```

**7. User can now login:**
```bash
POST http://localhost:YOUR_PORT/api/auth/login
{
  "email": "newbie@example.com",
  "password": "password123"
}
```
✅ **Result:** Login successful!

## 📚 Full Documentation

- **API Reference:** `BETA_ACCESS_DOCUMENTATION.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

## 🎊 That's It!

Your beta access system is ready to use. Enjoy! 🚀
