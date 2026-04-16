# Community Platform - Comprehensive Implementation Plan

## 📋 Proje Yapısı

### 1️⃣ AUTHENTICATION & USER MANAGEMENT

#### 1.1 Veritabanı Şeması
```
Users Table:
- id (UUID)
- username (unique, 3-30 char)
- email (unique, verified)
- password_hash (bcrypt)
- full_name
- avatar_url
- bio
- created_at
- updated_at
- is_active
- email_verified
- role_id (FK) → Roles

Roles Table:
- id (UUID)
- name (admin, moderator, member)
- permissions (JSON or separate table)
- created_at

UserProfiles Table:
- id (UUID)
- user_id (FK)
- points_total
- level
- badges
- threads_count
- comments_count
- followers_count
- following_count
- last_active
- created_at
```

#### 1.2 Authentication Flow
- [x] User Registration
- [x] Email Verification
- [x] Login (JWT token)
- [x] Refresh Token
- [x] Logout
- [x] Password Reset
- [x] OAuth2 (optional: GitHub, Google)

#### 1.3 Features
- Password hashing (bcrypt)
- JWT tokens (access + refresh)
- Email verification
- Rate limiting on auth endpoints
- Session management

---

### 2️⃣ ROLE & PERMISSION SYSTEM

#### 2.1 Roles
```
ADMIN
- Tüm izinlere sahip
- Kullanıcı yönetimi
- Community yönetimi

MODERATOR
- Thread/comment moderation
- User warnings
- Category management

MEMBER
- Thread açma
- Yorum yapma
- Beğeni verme
- Kategori oluşturma (permission-based)
```

#### 2.2 Permission Structure
```
Permissions Table:
- id
- name (create_thread, create_category, edit_own_thread, etc.)
- description
- action (CREATE, READ, UPDATE, DELETE)
- resource (thread, category, comment, user)

RolePermissions Table:
- role_id (FK)
- permission_id (FK)
```

#### 2.3 Default Permissions
- Member → create_thread, create_comment, like_content
- Moderator → Member perms + edit_any_thread, delete_any_comment, ban_user
- Admin → Everything

---

### 3️⃣ COMMUNITY STRUCTURE

#### 3.1 Veritabanı Şeması
```
Communities Table:
- id (UUID)
- name
- description
- icon_url
- banner_url
- owner_id (FK → Users)
- is_public
- created_at
- updated_at
- members_count
- threads_count

Categories Table:
- id (UUID)
- community_id (FK)
- name
- description
- slug
- icon
- color
- order (position)
- created_by (FK → Users)
- threads_count
- created_at

Threads Table:
- id (UUID)
- category_id (FK)
- author_id (FK → Users)
- title
- content (markdown)
- slug
- is_pinned
- is_locked
- views_count
- replies_count
- created_at
- updated_at
- last_reply_at

Comments Table:
- id (UUID)
- thread_id (FK)
- parent_comment_id (FK, null for top-level)
- author_id (FK → Users)
- content (markdown)
- likes_count
- is_edited
- created_at
- updated_at

Likes Table:
- id (UUID)
- user_id (FK)
- thread_id (FK, nullable)
- comment_id (FK, nullable)
- created_at
```

#### 3.2 Hierarchical Structure
```
Community
├── Category 1
│   ├── Thread 1
│   │   ├── Comment 1
│   │   │   └── Reply 1
│   │   └── Comment 2
│   └── Thread 2
├── Category 2
└── Category 3
```

---

### 4️⃣ POINTS & LEVEL SYSTEM

#### 4.1 Veritabanı Şeması
```
UserPoints Table:
- id (UUID)
- user_id (FK)
- points_total
- level
- points_history (actions that earned points)

PointsLog Table:
- id (UUID)
- user_id (FK)
- action_type (thread_created, comment_posted, like_received, etc.)
- points_earned
- reference_id (thread_id, comment_id)
- created_at

Badges Table:
- id (UUID)
- name (helpful_contributor, active_member, etc.)
- description
- icon
- points_threshold
- created_at

UserBadges Table:
- user_id (FK)
- badge_id (FK)
- earned_at
```

#### 4.2 Point Distribution
```
İşlem                      Puan
─────────────────────────────
Thread yaratma          → 10 points
Comment yapma           → 5 points
Beğeni aldı (thread)    → 2 points
Beğeni aldı (comment)   → 1 point
Cevap aldı              → 3 points
─────────────────────────────

Level Sistemi:
Level 1: 0-50 points       → "Newcomer"
Level 2: 51-150 points     → "Active Member"
Level 3: 151-300 points    → "Contributor"
Level 4: 301-600 points    → "Power User"
Level 5: 601+ points       → "Community Leader"
```

#### 4.3 Features
- Auto-calculation on actions
- Level-up notifications
- Badge unlocking
- Leaderboard (weekly, monthly, all-time)

---

### 5️⃣ SOCIAL FEATURES

#### 5.1 Relationships
```
UserFollows Table:
- follower_id (FK)
- following_id (FK)
- created_at
- unique constraint: (follower_id, following_id)

UserSubscriptions Table:
- user_id (FK)
- category_id (FK)
- created_at
```

#### 5.2 Notifications
```
Notifications Table:
- id (UUID)
- recipient_id (FK)
- actor_id (FK)
- type (reply_to_thread, like, mention, etc.)
- reference_id (thread_id, comment_id)
- is_read
- created_at

Notification Types:
- Someone replied to your thread
- Someone liked your comment
- New thread in subscribed category
- You were mentioned
```

---

### 6️⃣ MODERATION

#### 6.1 Veritabanı Şeması
```
Reports Table:
- id (UUID)
- reported_by (FK → Users)
- content_type (thread, comment)
- content_id (UUID)
- reason
- status (pending, reviewed, resolved)
- created_at
- resolved_at
- resolved_by (FK)

UserWarnings Table:
- id (UUID)
- user_id (FK)
- reason
- issued_by (FK)
- warning_level (1-3, 3 = ban)
- created_at

ModerationLogs Table:
- action (delete_thread, ban_user, etc.)
- user_id (affected user)
- moderator_id (who did it)
- reason
- created_at
```

#### 6.2 Moderation Actions
- Delete/hide inappropriate content
- Warn/suspend users
- Ban users
- Lock/pin threads
- Merge/move threads

---

### 7️⃣ BACKEND API DESIGN

#### 7.1 Auth Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/auth/me
PUT    /api/v1/auth/profile
```

#### 7.2 Community Endpoints
```
GET    /api/v1/communities
GET    /api/v1/communities/{id}
POST   /api/v1/communities (admin)
PUT    /api/v1/communities/{id} (admin)

GET    /api/v1/communities/{id}/categories
POST   /api/v1/communities/{id}/categories (moderator+)
PUT    /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
```

#### 7.3 Thread Endpoints
```
GET    /api/v1/categories/{id}/threads
POST   /api/v1/categories/{id}/threads (authenticated)
GET    /api/v1/threads/{id}
PUT    /api/v1/threads/{id} (author/admin)
DELETE /api/v1/threads/{id} (author/admin)

POST   /api/v1/threads/{id}/like
DELETE /api/v1/threads/{id}/like
```

#### 7.4 Comment Endpoints
```
GET    /api/v1/threads/{id}/comments
POST   /api/v1/threads/{id}/comments (authenticated)
PUT    /api/v1/comments/{id} (author/admin)
DELETE /api/v1/comments/{id} (author/admin)

POST   /api/v1/comments/{id}/like
DELETE /api/v1/comments/{id}/like
```

#### 7.5 User Endpoints
```
GET    /api/v1/users/{id}
GET    /api/v1/users/{id}/profile
GET    /api/v1/users/{id}/threads
GET    /api/v1/users/{id}/comments
GET    /api/v1/users/leaderboard

POST   /api/v1/users/{id}/follow
DELETE /api/v1/users/{id}/follow

GET    /api/v1/notifications
PUT    /api/v1/notifications/{id}/read
```

#### 7.6 Moderation Endpoints (Admin/Mod only)
```
GET    /api/v1/reports
POST   /api/v1/reports
PUT    /api/v1/reports/{id}
DELETE /api/v1/threads/{id} (enforce)
POST   /api/v1/users/{id}/warn
POST   /api/v1/users/{id}/ban
```

---

### 8️⃣ FRONTEND PAGES & COMPONENTS

#### 8.1 Authentication Pages
- Sign Up page
- Sign In page
- Email Verification page
- Forgot Password page
- Reset Password page
- Two-Factor Authentication (optional)

#### 8.2 Community Pages
```
/community
├── / (landing/all communities)
├── /{communityId} (community home)
│   ├── /categories (category listing)
│   ├── /categories/{categoryId} (threads in category)
│   ├── /threads/{threadId} (thread detail + comments)
│   ├── /threads/new (create thread)
│   └── /leaderboard
├── /settings (community settings, admin)
└── /moderation (mod panel)

/user
├── /{userId} (public profile)
├── /me (my profile)
├── /me/threads (my threads)
├── /me/comments (my comments)
└── /me/settings (preferences)

/search
└── ?q=... (threads, comments, users)
```

#### 8.3 Components
**Authentication:**
- LoginForm, SignUpForm, PasswordResetForm

**Community:**
- CategoryList, CategoryCard
- ThreadList, ThreadCard, ThreadDetail
- CommentSection, CommentThread (nested)
- ReplyForm

**User:**
- UserCard, UserProfile
- UserBadges, LevelBadge
- FollowButton, UserLeaderboard

**Moderation:**
- ReportForm, ReportList
- ModerationPanel, UserWarnings

**General:**
- SearchBar, Pagination
- Notification Bell, NotificationDropdown
- Editor (markdown), PreviewModal

---

### 9️⃣ TECH STACK

**Backend (Existing):**
- FastAPI (Python)
- Supabase (PostgreSQL)
- SQLAlchemy ORM
- Pydantic validation

**Frontend (Existing):**
- Next.js
- React
- TailwindCSS
- Zustand/Redux (state management)
- React Query (data fetching)

**Additional Libraries:**
- Backend: python-jose (JWT), bcrypt, python-multipart
- Frontend: react-markdown, @react-icons, date-fns

---

### 🔟 IMPLEMENTATION PHASES

#### Phase 1: User & Auth System ⭐ START HERE
- User registration/login
- Email verification
- JWT token management
- Profile management
- Password reset

#### Phase 2: Role & Permission System
- Role definitions
- Permission system
- Role-based access control
- Admin panel

#### Phase 3: Community Structure
- Communities & Categories
- Basic CRUD operations
- Category management

#### Phase 4: Thread & Comments
- Thread creation/editing/deletion
- Nested comments
- Thread detail view
- Search threads

#### Phase 5: Points & Level System
- Point calculation
- Level progression
- Badge system
- Leaderboard

#### Phase 6: Social Features
- User follows
- Likes/upvotes
- Notifications
- Subscriptions

#### Phase 7: Moderation
- Report system
- User warnings
- Content moderation
- Admin logs

#### Phase 8: Polish & Optimization
- Performance tuning
- UI/UX improvements
- Mobile optimization
- Security audit

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Database Schema Setup** (PostgreSQL in Supabase)
2. **Backend Models** (SQLAlchemy)
3. **Authentication Routes** (FastAPI)
4. **Frontend Auth Pages** (Next.js)
5. **Testing & Validation**

Hangi fazdan başlamak istersin? Phase 1: User & Auth'tan mı başlayalım?
