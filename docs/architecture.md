# Multi-Tenant SaaS Platform - System Architecture

Complete system architecture documentation using text-based diagrams for GitHub compatibility.

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE SYSTEM ARCHITECTURE                     │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER (Presentation)                                             │
├──────────────────────────────────────────────────────────────────────────┤
│  Web Browser          Admin Portal           Mobile App (Future)          │
│  (React + Vite)       (Super Admin)          (React Native)               │
│  TailwindCSS          Port: 3001             Port: TBD                    │
│  Port: 3000                                                               │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        HTTPS REST API + JWT Auth
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Business Logic)                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Nginx Load Balancer → Express.js Server (Port 5000)                     │
│                       ↓                                                    │
│     Middleware Stack:                                                     │
│     • CORS Handler                                                        │
│     • JWT Validator                                                       │
│     • Request Parser                                                      │
│     • Validator                                                           │
│     • Auth Guard                                                          │
│     • Error Handler                                                       │
│                       ↓                                                    │
│     API Modules:                                                          │
│     • Auth (4 routes)                                                     │
│     • Tenants (4 routes)                                                  │
│     • Users (3 routes)                                                    │
│     • Projects (4 routes)                                                 │
│     • Tasks (4 routes)                                                    │
│                                                                            │
│  Total: 19 RESTful API Endpoints                                         │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          Parameterized SQL
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│  DATA LAYER (Persistence)                                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PostgreSQL 15 Database (Port 5432 / Docker: 5433)                       │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │  5 Tables with Full ACID Compliance                            │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                                                                 │      │
│  │ TENANTS (Multi-Tenant Root)                                    │      │
│  │ ├─ id: UUID (Primary Key)                                      │      │
│  │ ├─ name: VARCHAR (UNIQUE)                                      │      │
│  │ ├─ subdomain: VARCHAR (UNIQUE) - for domain routing            │      │
│  │ ├─ status: ENUM(active, inactive, archived)                    │      │
│  │ ├─ subscription_plan: VARCHAR (free|pro|enterprise)            │      │
│  │ ├─ max_users: INTEGER - plan-based limit                       │      │
│  │ ├─ max_projects: INTEGER - plan-based limit                    │      │
│  │ ├─ created_at: TIMESTAMP                                       │      │
│  │ └─ updated_at: TIMESTAMP                                       │      │
│  │                                                                 │      │
│  │ USERS (Tenant-Isolated User Accounts)                          │      │
│  │ ├─ id: UUID (Primary Key)                                      │      │
│  │ ├─ tenant_id: UUID (Foreign Key → TENANTS)                     │      │
│  │ ├─ email: VARCHAR (UNIQUE per tenant)                          │      │
│  │ ├─ password_hash: VARCHAR (bcryptjs, 10 salt rounds)           │      │
│  │ ├─ full_name: VARCHAR                                          │      │
│  │ ├─ role: ENUM(super_admin, tenant_admin, user)                 │      │
│  │ ├─ is_active: BOOLEAN                                          │      │
│  │ ├─ created_at: TIMESTAMP                                       │      │
│  │ └─ updated_at: TIMESTAMP                                       │      │
│  │                                                                 │      │
│  │ PROJECTS (Project Management)                                  │      │
│  │ ├─ id: UUID (Primary Key)                                      │      │
│  │ ├─ tenant_id: UUID (Foreign Key → TENANTS)                     │      │
│  │ ├─ name: VARCHAR                                               │      │
│  │ ├─ description: TEXT                                           │      │
│  │ ├─ status: ENUM(active, inactive, archived, completed)         │      │
│  │ ├─ created_by: UUID (Foreign Key → USERS)                      │      │
│  │ ├─ created_at: TIMESTAMP                                       │      │
│  │ └─ updated_at: TIMESTAMP                                       │      │
│  │                                                                 │      │
│  │ TASKS (Task Management)                                        │      │
│  │ ├─ id: UUID (Primary Key)                                      │      │
│  │ ├─ project_id: UUID (Foreign Key → PROJECTS)                   │      │
│  │ ├─ tenant_id: UUID (Foreign Key → TENANTS)                     │      │
│  │ ├─ title: VARCHAR                                              │      │
│  │ ├─ description: TEXT                                           │      │
│  │ ├─ status: ENUM(open, in_progress, completed, closed)          │      │
│  │ ├─ priority: ENUM(high, medium, low)                           │      │
│  │ ├─ assigned_to: UUID (Foreign Key → USERS, nullable)           │      │
│  │ ├─ due_date: DATE (nullable)                                   │      │
│  │ ├─ created_at: TIMESTAMP                                       │      │
│  │ └─ updated_at: TIMESTAMP                                       │      │
│  │                                                                 │      │
│  │ AUDIT_LOGS (Immutable Audit Trail)                             │      │
│  │ ├─ id: BIGSERIAL (Primary Key)                                 │      │
│  │ ├─ tenant_id: UUID (Foreign Key → TENANTS)                     │      │
│  │ ├─ user_id: UUID (Foreign Key → USERS)                         │      │
│  │ ├─ entity_type: VARCHAR (tenants, users, projects, tasks)      │      │
│  │ ├─ action: VARCHAR (CREATE, READ, UPDATE, DELETE)              │      │
│  │ ├─ details: JSONB (full change record with old/new values)     │      │
│  │ ├─ ip_address: VARCHAR (for security auditing)                 │      │
│  │ └─ created_at: TIMESTAMP (immutable)                           │      │
│  │                                                                 │      │
│  │ Performance Indexes:                                            │      │
│  │ ├─ tenant_id on all tables (fast tenant isolation)              │      │
│  │ ├─ email on USERS (login lookups)                              │      │
│  │ ├─ project_id on TASKS (project queries)                       │      │
│  │ ├─ created_at on AUDIT_LOGS (time range queries)               │      │
│  │ └─ user_id on AUDIT_LOGS (user activity queries)               │      │
│  │                                                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints (19 Total)

### Auth Module (4 endpoints)
```
POST   /api/auth/register-tenant      → Create new tenant + admin user
POST   /api/auth/login                → User login (returns JWT)
POST   /api/auth/logout               → User logout
POST   /api/auth/refresh-token        → Refresh expired JWT token
```

### Tenants Module (4 endpoints)
```
POST   /api/tenants                   → Create new tenant (super_admin only)
GET    /api/tenants                   → List tenants (super_admin only)
GET    /api/tenants/:id               → Get tenant details (super_admin only)
PATCH  /api/tenants/:id               → Update tenant (super_admin only)
```

### Users Module (3 endpoints)
```
POST   /api/users                     → Create user (tenant_admin+)
GET    /api/users                     → List users (tenant_admin+)
PATCH  /api/users/:id                 → Update user (tenant_admin+)
```

### Projects Module (4 endpoints)
```
POST   /api/projects                  → Create project (tenant_admin+)
GET    /api/projects                  → List projects (all authenticated)
GET    /api/projects/:id              → Get project details (all authenticated)
PATCH  /api/projects/:id              → Update project (tenant_admin+)
```

### Tasks Module (4 endpoints)
```
POST   /api/tasks                     → Create task (all authenticated)
GET    /api/tasks                     → List tasks (all authenticated)
GET    /api/tasks/:id                 → Get task details (all authenticated)
PATCH  /api/tasks/:id                 → Update task (assigned user or admin)
```

## Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Each tenant's data is completely isolated:                 │
│                                                               │
│  TENANT A: Acme Corp                                        │
│  ├─ JWT Token contains tenant_id = 'acme-uuid'              │
│  ├─ All queries filtered: WHERE tenant_id = 'acme-uuid'    │
│  ├─ 50 users, 10 projects, 200 tasks                        │
│  └─ 5000 audit log entries                                  │
│                                                               │
│  TENANT B: Demo Company                                     │
│  ├─ JWT Token contains tenant_id = 'demo-uuid'              │
│  ├─ All queries filtered: WHERE tenant_id = 'demo-uuid'    │
│  ├─ 25 users, 5 projects, 100 tasks                         │
│  └─ 2000 audit log entries                                  │
│                                                               │
│  TENANT C: Enterprise Client                                │
│  ├─ JWT Token contains tenant_id = 'enterprise-uuid'        │
│  ├─ All queries filtered: WHERE tenant_id = 'enterprise'   │
│  ├─ 200 users, 50 projects, 2000 tasks                      │
│  └─ 50000 audit log entries                                 │
│                                                               │
│  All data is row-level isolated in the same database.       │
│  This is database-row-level multi-tenancy (most efficient). │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

```
┌──────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW (JWT)                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Client sends: POST /api/auth/login                       │
│     Body: { email, password }                                │
│                     ↓                                         │
│  2. Server validates email + password                        │
│     Query: SELECT * FROM users WHERE email = ?              │
│                     ↓                                         │
│  3. Compare password hash                                    │
│     bcrypt.compare(inputPassword, storedHash)                │
│                     ↓                                         │
│  4. Generate JWT token (HS256)                               │
│     Header: { "alg": "HS256", "typ": "JWT" }                │
│     Payload: { user_id, tenant_id, role, email }            │
│     Secret: process.env.JWT_SECRET (32+ chars)               │
│     Expires: 24 hours                                        │
│                     ↓                                         │
│  5. Return token to client                                   │
│     Response: { success, token, user }                       │
│                     ↓                                         │
│  6. Client stores token in localStorage                      │
│     localStorage.setItem('authToken', token)                 │
│                     ↓                                         │
│  7. Client includes in all subsequent requests               │
│     Headers: { Authorization: "Bearer <token>" }             │
│                     ↓                                         │
│  8. Server middleware validates token                        │
│     jwt.verify(token, secret)                                │
│     Extracts: user_id, tenant_id, role                       │
│                     ↓                                         │
│  9. Request proceeds with authenticated context              │
│                                                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│          AUTHORIZATION MATRIX (RBAC)                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  SUPER_ADMIN (System Administrator)                          │
│  ├─ Access Level: System-wide                                │
│  ├─ Can manage: All tenants, all users, system settings      │
│  ├─ Endpoints: All endpoints                                 │
│  └─ Restrictions: None (full system access)                  │
│                                                                │
│  TENANT_ADMIN (Tenant Administrator)                         │
│  ├─ Access Level: Tenant-wide                                │
│  ├─ Can manage: Users in their tenant, projects, settings    │
│  ├─ Endpoints: Most endpoints except super_admin routes      │
│  └─ Restrictions: Cannot access other tenants' data          │
│                                                                │
│  USER (Regular User)                                         │
│  ├─ Access Level: User's workspace                           │
│  ├─ Can access: Assigned projects, their own tasks           │
│  ├─ Can create: Tasks, comment on projects                   │
│  └─ Restrictions: Cannot manage users, cannot delete         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│          DOCKER COMPOSE DEVELOPMENT SETUP                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  docker-compose.yml defines 3 services:                      │
│                                                                │
│  SERVICE 1: Database                                         │
│  ├─ Image: postgres:15-alpine                                │
│  ├─ Container: saas_database                                 │
│  ├─ Port Mapping: 5433:5432 (host:container)                │
│  ├─ Environment:                                             │
│  │  ├─ POSTGRES_DB=saas_platform                             │
│  │  ├─ POSTGRES_USER=saas_user                               │
│  │  └─ POSTGRES_PASSWORD=saas_password_secure                │
│  ├─ Volume: db_data:/var/lib/postgresql/data                 │
│  └─ Health Check: pg_isready utility                         │
│                                                                │
│  SERVICE 2: Backend                                          │
│  ├─ Build: ./backend/Dockerfile                              │
│  ├─ Container: saas_backend                                  │
│  ├─ Port: 5000:5000                                          │
│  ├─ Environment: (from .env)                                 │
│  │  ├─ NODE_ENV=production                                   │
│  │  ├─ DATABASE_URL=postgresql://...                         │
│  │  ├─ JWT_SECRET=...                                        │
│  │  └─ CORS_ORIGIN=http://localhost:3000                     │
│  ├─ Depends On: database (service_healthy)                   │
│  └─ Health Check: curl /api/health                           │
│                                                                │
│  SERVICE 3: Frontend                                         │
│  ├─ Build: ./frontend/Dockerfile                             │
│  ├─ Container: saas_frontend                                 │
│  ├─ Port: 3000:80                                            │
│  ├─ Base Image: node:18-alpine (build) + nginx (serve)       │
│  ├─ Environment:                                             │
│  │  └─ VITE_API_URL=http://localhost:5000/api                │
│  └─ Health Check: curl http://localhost:80                   │
│                                                                │
│  Network: saas_network (bridge driver)                       │
│  All services communicate via: hostname:port (e.g., database:5432)
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌──────────────────────────────────────────────────────────────┐
│               SECURITY ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Authentication Security:                                     │
│  ├─ Passwords: bcryptjs (10 salt rounds)                      │
│  ├─ JWTs: HS256 algorithm with 32+ char secret                │
│  ├─ Token Expiry: 24 hours (refresh token mechanism)          │
│  ├─ HTTPS Only: In production (TLS 1.2+)                      │
│  └─ Secure Headers: X-Frame-Options, X-Content-Type-Options  │
│                                                                │
│  Data Protection:                                             │
│  ├─ Parameterized Queries: All SQL uses ? placeholders        │
│  ├─ SQL Injection Prevention: pg-pool prepared statements     │
│  ├─ Input Validation: joi schemas on all endpoints            │
│  ├─ Tenant Isolation: Every query filters by tenant_id        │
│  └─ Encryption: Passwords encrypted with bcryptjs            │
│                                                                │
│  API Security:                                                │
│  ├─ CORS: Restricted to whitelisted origins                   │
│  ├─ Rate Limiting: Planned (express-rate-limit)               │
│  ├─ Request Size Limits: 10MB max JSON payload                │
│  ├─ Header Validation: Content-Type checking                  │
│  └─ Error Handling: No sensitive data in error messages       │
│                                                                │
│  Audit & Monitoring:                                          │
│  ├─ Audit Logs: All CRUD operations logged                    │
│  ├─ IP Tracking: User IP address recorded in audit logs       │
│  ├─ User Actions: User ID, entity type, action, timestamp     │
│  ├─ Change Details: JSONB format for full change history      │
│  └─ Immutable: Audit logs cannot be modified/deleted          │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌──────────────────────────────────────────────────────────────┐
│            PERFORMANCE STRATEGIES                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Database Level:                                              │
│  ├─ Indexes: tenant_id, email, project_id, created_at         │
│  ├─ Connection Pool: pg-pool with 10-20 connections           │
│  ├─ Prepared Statements: Reuse query plans                     │
│  ├─ Query Optimization: EXPLAIN ANALYZE on slow queries        │
│  └─ Vacuum: Automatic maintenance to reclaim disk space       │
│                                                                │
│  Application Level:                                           │
│  ├─ Pagination: Limit/offset on list endpoints                │
│  ├─ Filtering: tenant_id, status, date range filters          │
│  ├─ Lazy Loading: Load related data on demand                  │
│  ├─ Caching: Redis (future for frequently accessed data)       │
│  └─ Compression: gzip on all responses                         │
│                                                                │
│  Client Level:                                                │
│  ├─ Code Splitting: Vite dynamic imports                       │
│  ├─ Asset Compression: CSS/JS minification                     │
│  ├─ Image Optimization: Next-gen formats (WebP)                │
│  ├─ Caching: Long-lived cache headers for static assets        │
│  └─ CDN: Global distribution (AWS CloudFront, Azure CDN)       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Login Flow
```
User → [email, password] → API /auth/login
                            ↓
                      Query database
                            ↓
                      Validate credentials
                            ↓
                      Generate JWT token
                            ↓
User ← [success, token, user data]
        ↓
User stores token in localStorage
        ↓
User includes token in subsequent requests
```

### Create Task Flow
```
User → [task data] → POST /api/tasks
                      ↓
                Validate input (joi)
                      ↓
                Verify authentication (JWT)
                      ↓
                Verify authorization (role)
                      ↓
                Check tenant isolation
                      ↓
                Insert to TASKS table
                      ↓
                Log to AUDIT_LOGS
                      ↓
User ← [success, created task]
```

### Query Projects Flow
```
User → GET /api/projects
        ↓
  Authenticate (JWT validation)
        ↓
  Extract tenant_id from token
        ↓
  Query: SELECT * FROM projects WHERE tenant_id = ?
        ↓
  Apply pagination (limit, offset)
        ↓
  Apply filters (status, created_by)
        ↓
  Return filtered projects to user
```

