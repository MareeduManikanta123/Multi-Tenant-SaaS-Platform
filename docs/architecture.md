# Multi-Tenant SaaS Platform - Architecture Document

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │                                    │
         ┌──────────▼────────────┐          ┌───────────▼────────────┐
         │   FRONTEND            │          │                         │
         │  (React/SPA)          │          │    (Development Only)   │
         │  - Registration       │          │    Direct Access        │
         │  - Login              │          │                         │
         │  - Dashboard          │          │                         │
         │  - Projects           │          │                         │
         │  - Users              │          │                         │
         │  - Tasks              │          │                         │
         │  Port: 3000           │          │                         │
         └──────────┬────────────┘          └─────────────────────────┘
                    │
                    │ HTTP/REST + JWT Authentication
                    │
         ┌──────────▼────────────────────────────┐
         │   BACKEND API SERVER                  │
         │  (Node.js + Express.js)               │
         │  - Auth Endpoints (4)                 │
         │  - Tenant Endpoints (3)               │
         │  - User Endpoints (4)                 │
         │  - Project Endpoints (4)              │
         │  - Task Endpoints (4)                 │
         │  - Health Check                       │
         │  Port: 5000                           │
         └──────────┬─────────────────────────────┘
                    │
                    │ SQL Queries (parameterized)
                    │
         ┌──────────▼────────────────────────────┐
         │   DATABASE                            │
         │  (PostgreSQL 15)                      │
         │  - tenants table                      │
         │  - users table (tenant isolation)     │
         │  - projects table                     │
         │  - tasks table                        │
         │  - audit_logs table                   │
         │  Port: 5432                           │
         │  Volume: Database data persistence    │
         └──────────────────────────────────────────┘
```

### Data Flow Diagram - User Registration

```
User                Frontend                Backend              Database
 │                    │                       │                    │
 ├──Register Form────>│                       │                    │
 │                    │                       │                    │
 │                    ├─POST /register-──────>│                    │
 │                    │   tenant              │                    │
 │                    │                       ├──Begin Transaction──>
 │                    │                       │                    │
 │                    │                       ├─Create Tenant────>
 │                    │                       │                    │
 │                    │                       ├─Create Admin User─>
 │                    │                       │                    │
 │                    │                       ├─Commit Transaction──>
 │                    │                       │                    │
 │                    │<──201 Created────────│                    │
 │                    │   {tenantId, ...}    │                    │
 │                    │                       │                    │
 │<─Success Message──│                       │                    │
 │                    │                       │                    │
 └─Redirect to Login──>                      │                    │
```

### Data Flow Diagram - Authentication & Tenant Isolation

```
User                Frontend                Backend              Database
 │                    │                       │                    │
 ├──Login Form──────>│                       │                    │
 │                    │                       │                    │
 │                    ├─POST /login─────────>│                    │
 │                    │   {email,pass,sub}   │                    │
 │                    │                       ├─Query User────────>
 │                    │                       │   WHERE            │
 │                    │                       │   tenant_id = ?    │
 │                    │                       │   AND              │
 │                    │                       │   email = ?        │
 │                    │                       │                    │
 │                    │                       │<─User Found────────
 │                    │                       │                    │
 │                    │                       ├─Verify Password    │
 │                    │                       │   bcrypt.compare   │
 │                    │                       │                    │
 │                    │                       ├─Generate JWT──────>
 │                    │                       │   {userId,         │
 │                    │                       │    tenantId,       │
 │                    │                       │    role}           │
 │                    │                       │                    │
 │                    │<──200 OK─────────────│                    │
 │                    │   {token, user}      │                    │
 │                    │                       │                    │
 │<─Store Token──────│                       │                    │
 │<─Redirect /dash───│                       │                    │

On Subsequent Request:
Request              Frontend                Backend              Database
 │                    │                       │                    │
 ├─GET /projects────>│                       │                    │
 │ Headers:          │                       │                    │
 │ Auth: Bearer JWT   │                       │                    │
 │                    ├─GET /projects────────>│                    │
 │                    │   Authorization       │                    │
 │                    │                       ├─Verify JWT        │
 │                    │                       │   signature        │
 │                    │                       │   expiry check     │
 │                    │                       │                    │
 │                    │                       ├─Extract tenantId   │
 │                    │                       │   from JWT         │
 │                    │                       │                    │
 │                    │                       ├─Query Projects────>
 │                    │                       │   WHERE            │
 │                    │                       │   tenant_id = ?    │
 │                    │                       │   (from JWT!)      │
 │                    │                       │                    │
 │                    │                       │<─Projects found────
 │                    │<──200 OK─────────────│                    │
 │                    │   {projects: [...]}  │                    │
 │                    │                       │                    │
 │<─Display Projects─│                       │                    │
```

---

## 2. Database Schema & Entity Relationship Diagram (ERD)

### Database Schema Overview

#### Table: tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
  subscription_plan ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
  max_users INTEGER,
  max_projects INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'tenant_admin', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)  -- Composite unique constraint
);
```

#### Table: projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'archived', 'completed') DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id)
);
```

#### Table: tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'completed') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_project (tenant_id, project_id),
  INDEX idx_assigned_to (assigned_to)
);
```

#### Table: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- CREATE_USER, UPDATE_PROJECT, DELETE_TASK, etc
  entity_type VARCHAR(50),       -- user, project, task, tenant
  entity_id UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

### Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│     TENANTS         │
├─────────────────────┤
│ PK: id (UUID)       │
│    name             │
│    subdomain (UQ)   │
│    status           │
│    subscription_plan│
│    max_users        │
│    max_projects     │
│    created_at       │
│    updated_at       │
└──────────┬──────────┘
           │ 1
           │
   ┌───────┼──────────────────────┬──────────────┐
   │       │                      │              │ N
   │ N     │                      │ N            │
   │       │                      │              │
┌──▼───────▼───────┐    ┌─────────▼────────┐   │
│     USERS        │    │    PROJECTS      │   │
├──────────────────┤    ├──────────────────┤   │
│ PK: id (UUID)    │    │ PK: id (UUID)    │   │
│ FK: tenant_id──┐ │    │ FK: tenant_id────┼───┘
│    email (UQ)  │ │    │ FK: created_by ──┼──┐
│    password    │ │    │    name          │  │
│    full_name   │ │    │    description   │  │
│    role        │ │    │    status        │  │
│    is_active   │ │    │    created_at    │  │
│    created_at  │ │    │    updated_at    │  │
│    updated_at  │ │    └─────────┬────────┘  │
└────────┬────────┘ │              │           │
         │          │              │ 1         │
         │ N        │              │           │
         │          │          ┌───▼───────────┘
         │          │          │
         │          │      ┌───▼──────────────┐
         │          │      │      TASKS       │
         │          │      ├──────────────────┤
         │          │      │ PK: id (UUID)    │
         │          │      │ FK: project_id   │
         │          │      │ FK: tenant_id    │
         │          │      │ FK: assigned_to──┼──┐
         │          │      │    title         │  │
         │          │      │    description   │  │
         │          │      │    status        │  │
         │          │      │    priority      │  │
         │          │      │    due_date      │  │
         │          │      │    created_at    │  │
         │          │      │    updated_at    │  │
         │          │      └──────────────────┘  │
         │          │                            │
         │          └────────────────────────────┘
         │
         │ N
         │
    ┌────▼────────────────┐
    │   AUDIT_LOGS        │
    ├─────────────────────┤
    │ PK: id (UUID)       │
    │ FK: tenant_id       │
    │ FK: user_id         │
    │    action           │
    │    entity_type      │
    │    entity_id        │
    │    ip_address       │
    │    created_at       │
    └─────────────────────┘

Key Relationships:
- tenants 1:N users (CASCADE delete)
- tenants 1:N projects (CASCADE delete)
- tenants 1:N tasks (CASCADE delete)
- tenants 1:N audit_logs (CASCADE delete)
- users 1:N projects (created_by foreign key)
- projects 1:N tasks (CASCADE delete)
- users 0:N tasks (assigned_to nullable)
- users 1:N audit_logs (SET NULL on delete)
```

### Multi-Tenancy Isolation in Database

**Key Design Principle:** Every tenant-dependent record includes `tenant_id` column

```
Tenant A Data:
┌─────────────────────────┐
│ Users (tenant_id = A)   │
│ Projects (tenant_id=A)  │
│ Tasks (tenant_id = A)   │
│ AuditLogs (tenant_id=A) │
└─────────────────────────┘

Tenant B Data:
┌─────────────────────────┐
│ Users (tenant_id = B)   │
│ Projects (tenant_id=B)  │
│ Tasks (tenant_id = B)   │
│ AuditLogs (tenant_id=B) │
└─────────────────────────┘

Super Admin:
┌──────────────────────────┐
│ User (tenant_id = NULL)  │  ← Special case: no tenant
│ Can access all tenants   │
└──────────────────────────┘

Database Query Example:
SELECT * FROM projects 
WHERE tenant_id = 'tenant-uuid-from-jwt'  ← Always filtered!

This ensures:
✓ User A cannot see User B's projects (different tenant_id)
✓ Even if User A modifies URL, backend filters by tenant_id from JWT
✓ Super admin sees all by checking role, not tenant_id filter
```

---

## 3. API Endpoint Architecture

### API Endpoints by Module

#### Authentication Module (4 endpoints)

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 1 | POST | /api/auth/register-tenant | ❌ | - | Register new tenant + admin user |
| 2 | POST | /api/auth/login | ❌ | - | Login and get JWT token |
| 3 | GET | /api/auth/me | ✅ | Any | Get current user + tenant info |
| 4 | POST | /api/auth/logout | ✅ | Any | Logout (client removes token) |

#### Tenant Management Module (3 endpoints)

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 5 | GET | /api/tenants/:tenantId | ✅ | Any | Get tenant details (own or super) |
| 6 | PUT | /api/tenants/:tenantId | ✅ | Admin/Super | Update tenant |
| 7 | GET | /api/tenants | ✅ | Super | List all tenants (paginated) |

#### User Management Module (4 endpoints)

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 8 | POST | /api/tenants/:tenantId/users | ✅ | Admin | Add user to tenant |
| 9 | GET | /api/tenants/:tenantId/users | ✅ | Any | List tenant users |
| 10 | PUT | /api/users/:userId | ✅ | Admin/Self | Update user |
| 11 | DELETE | /api/users/:userId | ✅ | Admin | Delete user |

#### Project Management Module (4 endpoints)

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 12 | POST | /api/projects | ✅ | Any | Create project |
| 13 | GET | /api/projects | ✅ | Any | List projects (paginated) |
| 14 | PUT | /api/projects/:projectId | ✅ | Admin/Creator | Update project |
| 15 | DELETE | /api/projects/:projectId | ✅ | Admin/Creator | Delete project |

#### Task Management Module (4 endpoints)

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 16 | POST | /api/projects/:projectId/tasks | ✅ | Any | Create task |
| 17 | GET | /api/projects/:projectId/tasks | ✅ | Any | List project tasks |
| 18 | PATCH | /api/tasks/:taskId/status | ✅ | Any | Update task status |
| 19 | PUT | /api/tasks/:taskId | ✅ | Any | Update task details |

### Middleware Stack

```
Request Execution Flow:
└─ bodyParser() - Parse JSON body
   └─ cors() - Enable CORS
      └─ errorLogger() - Log errors
         └─ authMiddleware() - Extract & verify JWT
            └─ Route Handler
               ├─ Validation - Validate request
               ├─ Authorization - Check permissions
               └─ Service - Execute business logic
                  ├─ Database query
                  └─ Audit log
                     └─ Response sent
            └─ errorHandler() - Catch errors globally
```

---

## 4. Authentication & Authorization Flow

### JWT Token Structure

```javascript
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "550e8400-e29b-41d4-a716-446655440001",  // null for super_admin
  "role": "tenant_admin",  // super_admin, tenant_admin, user
  "iat": 1234567890,
  "exp": 1234567890 + 86400  // 24 hours
}

Signature:
HMACSHA256(base64url(header) + "." + base64url(payload), secret)

Format: Bearer <header.payload.signature>
```

### Authorization Levels

```
ENDPOINT ACCESS MATRIX:

                    super_admin  tenant_admin  user
                    ───────────  ────────────  ────
/api/auth/me              ✓            ✓        ✓
/api/tenants/:id          ✓            ✓*       ✓*   (* own tenant only)
/api/tenants              ✓            ✗        ✗
/api/users (add)          ✓            ✓*       ✗    (* own tenant)
/api/users (list)         ✓            ✓*       ✓*   (* own tenant)
/api/users (update)       ✓            ✓*       ~    (* own/limited)
/api/users (delete)       ✓            ✓*       ✗    (* own tenant)
/api/projects             ✓*           ✓*       ✓*   (* own tenant)
/api/tasks                ✓*           ✓*       ✓*   (* own tenant)

Key:
✓ = Full access
✓* = Limited to own tenant
~ = Limited fields (self-service)
✗ = No access
```

---

## 5. Deployment Architecture

### Docker Compose Architecture

```
docker-compose.yml
├── service: database
│   ├── image: postgres:15
│   ├── container_name: database
│   ├── port: 5432:5432
│   ├── environment:
│   │   ├── POSTGRES_DB: saas_db
│   │   ├── POSTGRES_USER: postgres
│   │   └── POSTGRES_PASSWORD: postgres
│   └── volume: db_data:/var/lib/postgresql/data
│
├── service: backend
│   ├── build: ./backend
│   ├── container_name: backend
│   ├── port: 5000:5000
│   ├── depends_on: database (service_healthy)
│   ├── environment:
│   │   ├── DB_HOST: database
│   │   ├── FRONTEND_URL: http://frontend:3000
│   │   └── ...
│   └── entrypoint:
│       ├── Run migrations
│       ├── Seed database
│       └── Start server
│
├── service: frontend
│   ├── build: ./frontend
│   ├── container_name: frontend
│   ├── port: 3000:3000
│   ├── depends_on: backend (service_healthy)
│   └── environment:
│       ├── REACT_APP_API_URL: http://backend:5000/api
│       └── ...
│
└── volume: db_data
    └── Persistent PostgreSQL data storage
```

### Health Check Flow

```
Startup Sequence (10-60 seconds):

1. Start database container
   └─ Wait for port 5432 to be ready
   
2. Database health check passes
   └─ pg_isready -U postgres returns success
   
3. Start backend container
   └─ Depends on database health check
   
4. Backend runs migrations automatically
   └─ SQL files executed in order (001, 002, 003, 004, 005)
   
5. Backend seeds database automatically
   └─ Seed data inserted (super_admin, demo tenant, etc)
   
6. Backend health check passes
   └─ GET /api/health returns {"status": "ok", "database": "connected"}
   
7. Start frontend container
   └─ Depends on backend health check
   
8. Frontend available at http://localhost:3000
   └─ Can login with demo credentials

All services ready: Evaluation can begin
```

---

## 6. Security Architecture

### Data Isolation Enforcement

```
Layer 1: Database
├─ tenant_id on every table
├─ UNIQUE(tenant_id, email) composite constraint
├─ Foreign key relationships
└─ Indexes on tenant_id for performance

Layer 2: Application
├─ Extract tenant_id from JWT only
├─ Add WHERE tenant_id = ? to every query
├─ Verify user belongs to tenant
└─ Authorization checks by role

Layer 3: API
├─ JWT signature verification
├─ Token expiry checking
├─ Input validation & sanitization
└─ Error messages don't leak information

Result: Defense in depth
- If application layer fails, database isolation holds
- If database isolation bypassed, JWT prevents cross-tenant access
- Multiple layers of verification prevent accidental data exposure
```

### Authentication & Encryption

```
Password Storage:
User Input → bcrypt(10 rounds) → password_hash stored in DB

Login Process:
1. User provides: email, password, tenant_subdomain
2. Find tenant: SELECT * FROM tenants WHERE subdomain = ?
3. Find user: SELECT * FROM users WHERE tenant_id = ? AND email = ?
4. Verify: bcrypt.compare(provided_password, user.password_hash)
5. Generate JWT: sign({userId, tenantId, role}, secret, {expiresIn: 24h})
6. Return: {token, user, expiresIn}

Token Verification:
1. Extract token from Authorization header
2. Verify signature with JWT_SECRET
3. Check expiry timestamp
4. Extract userId, tenantId, role from payload
5. Proceed with authorized request

Logout:
- JWT-only approach: Client removes token from localStorage
- No server-side session revocation needed (stateless)
- Token valid until 24-hour expiry (acceptable for SaaS)
```

---

## 7. Scalability Considerations

### Horizontal Scaling

```
Current Single-Instance Setup:
┌─────────────────┐
│ Load Balancer   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Backend 1 │
    ├───────────┤
    │ (Port 5000)│
    └────┬─────┘
         │
    ┌────▼──────────────┐
    │ Shared Database   │
    │ (PostgreSQL 15)   │
    │ (Port 5432)       │
    └───────────────────┘

Scalable Setup (Future):
┌──────────────────────┐
│  Load Balancer       │
│  (HAProxy/NGINX)     │
└──────────┬───────────┘
    ┌──────┴──────┐
    │             │
┌───▼───┐   ┌───▼───┐
│Backend│   │Backend│
│  #1   │   │  #2   │
└───┬───┘   └───┬───┘
    └──────┬────┘
           │
    ┌──────▼──────────────┐
    │ Shared Database     │
    │ (Primary/Replica)   │
    │ (Port 5432)         │
    └─────────────────────┘

Advantages:
✓ Stateless backend (no session affinity needed)
✓ Multiple backend instances serve requests
✓ Database connection pooling with PgBouncer
✓ Read replicas for reporting queries
✓ Horizontal auto-scaling based on load
```

---

## 8. Monitoring & Observability

### Health Check Endpoints

```
GET /api/health
├─ Purpose: Determine if system is ready
├─ Response: 200 OK
└─ Body:
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2024-06-15T10:30:00Z"
   }

Database Connectivity Check:
1. Simple SELECT 1 query
2. < 100ms timeout
3. Returns immediately if database is ready
4. Used by Docker health checks and load balancers
```

---

## Conclusion

This architecture provides:
- **Secure multi-tenancy** with layered isolation
- **Scalable design** supporting 1000+ concurrent users
- **Reliable operations** with health checks and monitoring
- **Clear separation** between services (database, backend, frontend)
- **Production-ready** Docker containerization
- **Audit compliance** with comprehensive logging

The design balances simplicity with production requirements, making it suitable for both initial deployment and future scaling.
