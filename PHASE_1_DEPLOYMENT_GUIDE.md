# Phase 1: User & Auth System - Deployment Guide

## 🚀 Quick Start

This guide walks you through setting up the User Authentication system for Agent Arena Community Platform.

## Prerequisites

- Supabase account (https://supabase.com)
- Backend Python environment configured
- Frontend environment variables set
- SMTP email service configured

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Choose PostgreSQL database
3. Save your project credentials:
   - `PROJECT_URL` - Supabase URL for API calls
   - `ANON_KEY` - Supabase anonymous key
   - `SERVICE_ROLE_KEY` - For admin operations (backend only)
   - Database password and connection string

## Step 2: Deploy Database Schema

### Option A: Supabase Dashboard (Recommended for beginners)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the contents of `backend/community/01_database_schema.sql`
4. Paste into SQL editor
5. Click "Run" to execute

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-id <your-project-id>

# Push migrations
supabase db push
```

## Step 3: Configure Environment Variables

### Backend (.env in `backend/`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRATION_MINUTES=60
REFRESH_TOKEN_EXPIRATION_DAYS=30

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
APP_NAME=Agent Arena
APP_URL=https://agentarena.me

# Backend
BACKEND_URL=http://localhost:8000
DEBUG=True
```

### Frontend (.env.local in `frontend/`)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App
NEXT_PUBLIC_APP_NAME=Agent Arena
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Setup Email Service (Gmail App Password)

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to Security → App Passwords
4. Select "Mail" and "Windows Computer"
5. Generate app-specific password
6. Use this as `SENDER_PASSWORD` in .env

**Alternative:** Use SendGrid, Mailgun, or other SMTP providers

## Step 5: Install Backend Dependencies

```bash
cd backend
pip install -r requirements-auth.txt
```

### New dependencies (update `requirements.txt`):

```
PyJWT==2.8.1
passlib==1.7.4
python-multipart==0.0.6
email-validator==2.1.0
```

## Step 6: Update Main FastAPI App

### In `backend/main.py`, add auth routes:

```python
from backend.agents.auth.router import router as auth_router
from backend.agents.auth.profile_router import router as profile_router

# Include routers
app.include_router(auth_router)
app.include_router(profile_router)

# Add CORS if needed
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://agentarena.me"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 7: Initialize Default Roles

Run this in Supabase SQL Editor:

```sql
-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Platform administrator with full access'),
('moderator', 'Community moderator'),
('member', 'Regular community member')
ON CONFLICT (name) DO NOTHING;

-- Create a test user (optional)
INSERT INTO communities (name, description, is_public) VALUES
('Main Community', 'Main discussion community', TRUE);
```

## Step 8: Test API Endpoints

### 1. Register User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!",
    "full_name": "Test User"
  }'
```

### 2. Verify Email

```bash
curl -X POST http://localhost:8000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "email-token-from-email"}'
```

### 3. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "testuser",
    "password": "SecurePass123!",
    "remember_me": true
  }'
```

### 4. Get Profile (with token)

```bash
curl -X GET http://localhost:8000/api/users/profile \
  -H "Authorization: Bearer {access_token}"
```

## Step 9: Setup Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Create `.env.local` with values from Step 3.

Test login flow:

```bash
npm run dev
# Visit http://localhost:3000/auth/signup
```

## Step 10: Frontend-Backend Integration Checklist

- [ ] Auth API endpoints responding at `/api/auth/*`
- [ ] Profile API endpoints responding at `/api/users/*`
- [ ] Email verification emails sending successfully
- [ ] Password reset emails sending successfully
- [ ] JWT tokens working correctly
- [ ] CORS properly configured
- [ ] SignUp page working end-to-end
- [ ] SignIn page working end-to-end
- [ ] Verify Email page working
- [ ] Profile page loading user data
- [ ] Profile update working
- [ ] Password reset flow working

## Troubleshooting

### Email Not Sending

- Check SMTP credentials in `.env`
- Verify app-specific password for Gmail
- Check spam folder
- Review backend logs for SMTP errors

### JWT Token Invalid

- Verify `JWT_SECRET` matches in `.env`
- Check token expiration time
- Ensure `Authorization: Bearer {token}` format

### Database Connection Failed

- Verify Supabase URL and keys
- Check network connectivity
- Ensure database is running
- Review Supabase logs

### CORS Errors

- Add frontend URL to `allow_origins` in FastAPI CORS middleware
- Check request headers
- Ensure credentials handling is correct

## Production Deployment

### Before Going Live

1. **Set strong JWT_SECRET** - Use strong random string
2. **Enable HTTPS** - All communications should use SSL/TLS
3. **Set production database** - Use separate Supabase project
4. **Configure email service** - Use transactional email provider (SendGrid, Mailgun)
5. **Set rate limiting** - Protect against brute force attacks
6. **Enable 2FA** - For admin accounts
7. **Setup monitoring** - Track login attempts, failed validations
8. **Backup strategy** - Regular database backups

### Environment Variables (Production)

```env
DEBUG=False
ENVIRONMENT=production
JWT_SECRET=use-strong-random-string
ALLOWED_HOSTS=agentarena.me,www.agentarena.me
```

## Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/verify-email` | POST | No | Verify email |
| `/api/auth/forgot-password` | POST | No | Request password reset |
| `/api/auth/reset-password` | POST | No | Reset password |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/resend-verification` | POST | No | Resend verification email |
| `/api/users/profile` | GET | Yes | Get user profile |
| `/api/users/profile` | PUT | Yes | Update user profile |
| `/api/users/stats` | GET | Yes | Get user statistics |
| `/api/users/badges` | GET | Yes | Get user badges |
| `/api/users/public/{username}` | GET | No | Get public profile |
| `/api/users/follow/{user_id}` | POST | Yes | Follow user |
| `/api/users/follow/{user_id}` | DELETE | Yes | Unfollow user |

## Next Steps

After completing Phase 1:

1. Test full authentication flow
2. Verify email/password reset workflows
3. Move to Phase 2: Community & Categories system
4. Implement thread creation and comments
5. Add gamification (points, badges, levels)

## Support

For issues or questions:

1. Check Supabase documentation: https://supabase.com/docs
2. Review FastAPI docs: https://fastapi.tiangolo.com
3. Check Next.js docs: https://nextjs.org/docs
4. Review error logs in backend console

---

**Status**: Phase 1 ✅ Complete
**Next Phase**: Community & Categories System
**Estimated Setup Time**: 30-45 minutes
