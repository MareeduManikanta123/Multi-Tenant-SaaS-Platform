# Multi-Tenant SaaS Platform - Technical Specification

## 1. Project Structure

### Backend Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection configuration
│   │   ├── environment.js       # Environment variables validation
│   │   └── jwt.js               # JWT configuration
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   ├── authorize.js         # Role-based authorization
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── validation.js        # Request validation
│   │   └── tenant.js            # Tenant context extraction
│   ├── controllers/
│   │   ├── authController.js    # Auth endpoints (register, login, logout, me)
│   │   ├── tenantController.js  # Tenant management endpoints
│   │   ├── userController.js    # User management endpoints
│   │   ├── projectController.js # Project management endpoints
│   │   └── taskController.js    # Task management endpoints
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── tenants.js           # Tenant routes
│   │   ├── users.js             # User routes
│   │   ├── projects.js          # Project routes
│   │   ├── tasks.js             # Task routes
│   │   └── index.js             # Main route aggregator
│   ├── services/
│   │   ├── authService.js       # Business logic for auth
│   │   ├── tenantService.js     # Business logic for tenants
│   │   ├── userService.js       # Business logic for users
│   │   ├── projectService.js    # Business logic for projects
│   │   ├── taskService.js       # Business logic for tasks
│   │   └── auditService.js      # Audit logging service
│   ├── models/
│   │   ├── User.js              # User database queries
│   │   ├── Tenant.js            # Tenant database queries
│   │   ├── Project.js           # Project database queries
│   │   ├── Task.js              # Task database queries
│   │   └── AuditLog.js          # Audit log database queries
│   ├── utils/
│   │   ├── validators.js        # Input validation functions
│   │   ├── password.js          # Password hashing/verification
│   │   ├── jwt.js               # JWT generation/verification
│   │   ├── errors.js            # Custom error classes
│   │   └── constants.js         # Application constants
│   └── app.js                   # Express app configuration
├── database/
│   ├── migrations/
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_projects.sql
│   │   ├── 004_create_tasks.sql
│   │   ├── 005_create_audit_logs.sql
│   │   └── runMigrations.js     # Migration runner
│   └── seeds/
│       ├── seed_data.sql        # Seed data for development/testing
│       └── seedDatabase.js      # Seed runner
├── tests/
│   ├── auth.test.js             # Auth endpoint tests
│   ├── tenants.test.js          # Tenant endpoint tests
│   ├── users.test.js            # User endpoint tests
│   ├── projects.test.js         # Project endpoint tests
│   └── tasks.test.js            # Task endpoint tests
├── .env                         # Environment variables (development values)
├── .env.example                 # Environment variables template
├── Dockerfile                   # Docker container configuration
├── docker-entrypoint.sh        # Startup script (migrations + server)
├── package.json                 # Node.js dependencies
├── package-lock.json            # Locked dependency versions
├── server.js                    # Entry point
└── README.md                    # Backend setup documentation
```

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── RegisterPage.jsx         # Tenant registration
│   │   │   └── LoginPage.jsx            # User login
│   │   ├── Common/
│   │   │   ├── Navbar.jsx               # Navigation bar
│   │   │   ├── ProtectedRoute.jsx       # Protected route wrapper
│   │   │   ├── LoadingSpinner.jsx       # Loading indicator
│   │   │   └── ErrorBoundary.jsx        # Error handling
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.jsx        # Main dashboard
│   │   │   ├── StatsCard.jsx            # Statistics card component
│   │   │   └── RecentProjects.jsx       # Recent projects section
│   │   ├── Projects/
│   │   │   ├── ProjectsListPage.jsx     # Projects list
│   │   │   ├── ProjectDetailsPage.jsx   # Project details
│   │   │   ├── CreateProjectModal.jsx   # Create/Edit project modal
│   │   │   ├── TaskList.jsx             # Task list in project
│   │   │   └── CreateTaskModal.jsx      # Create/Edit task modal
│   │   ├── Tasks/
│   │   │   ├── TaskItem.jsx             # Individual task component
│   │   │   └── TaskStatusBadge.jsx      # Status display component
│   │   └── Users/
│   │       ├── UsersListPage.jsx        # Users management page
│   │       ├── UserTable.jsx            # Users table component
│   │       └── AddUserModal.jsx         # Add/Edit user modal
│   ├── services/
│   │   ├── api.js                       # Axios instance with interceptors
│   │   ├── authService.js               # Auth API calls
│   │   ├── tenantService.js             # Tenant API calls
│   │   ├── userService.js               # User API calls
│   │   ├── projectService.js            # Project API calls
│   │   └── taskService.js               # Task API calls
│   ├── context/
│   │   ├── AuthContext.jsx              # Authentication state
│   │   └── TenantContext.jsx            # Tenant information context
│   ├── hooks/
│   │   ├── useAuth.js                   # Auth context hook
│   │   ├── useTenant.js                 # Tenant context hook
│   │   └── useApi.js                    # API call hook
│   ├── pages/
│   │   ├── RegisterPage.jsx             # Tenant registration page (route)
│   │   ├── LoginPage.jsx                # Login page (route)
│   │   ├── DashboardPage.jsx            # Dashboard (route)
│   │   ├── ProjectsPage.jsx             # Projects list (route)
│   │   ├── ProjectDetailsPage.jsx       # Project details (route)
│   │   └── UsersPage.jsx                # Users management (route)
│   ├── styles/
│   │   ├── index.css                    # Global styles
│   │   ├── tailwind.css                 # Tailwind directives
│   │   └── components.css               # Component-specific styles
│   ├── utils/
│   │   ├── tokenStorage.js              # JWT token storage
│   │   ├── validators.js                # Client-side validation
│   │   ├── formatters.js                # Date/number formatting
│   │   └── constants.js                 # Application constants
│   ├── App.jsx                          # Main app component with routing
│   ├── App.css                          # App styles
│   ├── index.jsx                        # React DOM render
│   └── index.css                        # Index styles
├── public/
│   ├── index.html                       # HTML entry point
│   ├── favicon.ico                      # Favicon
│   └── logo.png                         # Logo
├── Dockerfile                           # Docker container configuration
├── .env.example                         # Environment variables template
├── vite.config.js                       # Vite configuration
├── tailwind.config.js                   # Tailwind CSS configuration
├── package.json                         # Node.js dependencies
├── package-lock.json                    # Locked dependency versions
└── README.md                            # Frontend setup documentation
```

### Database Structure

```
database/
├── migrations/
│   ├── 001_create_tenants.sql           # Create tenants table
│   ├── 002_create_users.sql             # Create users table with constraints
│   ├── 003_create_projects.sql          # Create projects table
│   ├── 004_create_tasks.sql             # Create tasks table with indexes
│   └── 005_create_audit_logs.sql        # Create audit_logs table
└── seeds/
    ├── seed_data.sql                    # Seed data (super admin, demo tenant, etc)
    └── seedDatabase.js                  # Runner script for seeds
```

---

## 2. Technology Stack Details

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",           // Web framework
    "pg": "^8.8.0",                 // PostgreSQL client
    "jsonwebtoken": "^9.0.0",       // JWT token generation/verification
    "bcryptjs": "^2.4.3",           // Password hashing
    "dotenv": "^16.0.3",            // Environment variables
    "cors": "^2.8.5",               // CORS handling
    "uuid": "^9.0.0"                // UUID generation
  },
  "devDependencies": {
    "nodemon": "^2.0.20",           // Auto-restart on file changes
    "jest": "^29.5.0",              // Testing framework
    "supertest": "^6.3.3"           // HTTP assertion library
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",             // UI library
    "react-dom": "^18.2.0",         // DOM rendering
    "react-router-dom": "^6.11.0",  // Client-side routing
    "axios": "^1.4.0",              // HTTP client
    "tailwindcss": "^3.3.0"         // CSS framework
  },
  "devDependencies": {
    "vite": "^4.3.0",               // Build tool
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.40.0"             // Code linting
  }
}
```

---

## 3. Database Schema

### Tables Overview

1. **tenants** - Organization records
2. **users** - User accounts with role-based access
3. **projects** - Projects belonging to tenants
4. **tasks** - Tasks within projects
5. **audit_logs** - Comprehensive activity logging

### Key Constraints & Indexes

- **Primary Keys:** All tables use UUID primary key
- **Tenant ID Column:** All tenant-dependent tables have tenant_id foreign key
- **Unique Constraints:** UNIQUE(tenant_id, email) on users table
- **Foreign Keys:** CASCADE delete relationships between tables
- **Indexes:** tenant_id indexed for query performance; composite indexes for common queries

---

## 4. API Architecture

### API Response Format

All endpoints follow consistent response format:

```javascript
// Success Response (200/201)
{
  "success": true,
  "data": { /* response data */ }
}

// Success Response with Message
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

- **200 OK** - Successful GET/PUT/DELETE
- **201 Created** - Successful POST (resource created)
- **400 Bad Request** - Validation error, invalid input
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - Authenticated but lacks permission
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists (duplicate)
- **500 Internal Server Error** - Server error (shouldn't expose details)

### Authentication Header

```
Authorization: Bearer <JWT_TOKEN>
```

### API Endpoints Summary

**Authentication Module** (4 endpoints)
- POST /api/auth/register-tenant
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

**Tenant Management** (3 endpoints)
- GET /api/tenants/:tenantId
- PUT /api/tenants/:tenantId
- GET /api/tenants

**User Management** (4 endpoints)
- POST /api/tenants/:tenantId/users
- GET /api/tenants/:tenantId/users
- PUT /api/users/:userId
- DELETE /api/users/:userId

**Project Management** (4 endpoints)
- POST /api/projects
- GET /api/projects
- PUT /api/projects/:projectId
- DELETE /api/projects/:projectId

**Task Management** (4 endpoints)
- POST /api/projects/:projectId/tasks
- GET /api/projects/:projectId/tasks
- PATCH /api/tasks/:taskId/status
- PUT /api/tasks/:taskId

---

## 5. Development Setup Guide

### Prerequisites

- **Node.js:** v18.0.0 or higher (LTS version)
- **npm:** v9.0.0 or higher
- **PostgreSQL:** v12 or higher (local installation or Docker)
- **Git:** For version control
- **Docker & Docker Compose:** For containerization (optional for local dev)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd SaaS_platform_FSD
```

#### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Update .env with local database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=saas_dev
# DB_USER=postgres
# DB_PASSWORD=postgres
# JWT_SECRET=your-super-secret-key-min-32-chars
# FRONTEND_URL=http://localhost:3000

# Create database (if not exists)
createdb saas_dev

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start development server (with auto-reload)
npm run dev
# Server runs on http://localhost:5000
```

#### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

#### 4. Verify Setup

- Backend: http://localhost:5000/api/health (should return { status: "ok", database: "connected" })
- Frontend: http://localhost:3000 (should display login page)
- Login with demo credentials: email: admin@demo.com, password: Demo@123, subdomain: demo

### Docker Deployment Setup

#### 1. Ensure Docker is Installed
```bash
docker --version
docker-compose --version
```

#### 2. Start All Services
```bash
# From project root
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f backend  # Backend logs
docker-compose logs -f frontend # Frontend logs
docker-compose logs -f database # Database logs
```

#### 3. Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

#### 4. Stop Services
```bash
docker-compose down
```

### Running Tests

#### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

#### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm run test:watch       # Run tests in watch mode
```

### Database Commands

#### Local Development
```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback

# Seed database
npm run seed

# Reset database (drop and recreate)
npm run reset-db
```

#### Docker
```bash
# Connect to database container
docker-compose exec database psql -U postgres -d saas_db

# Backup database
docker-compose exec database pg_dump -U postgres saas_db > backup.sql

# Restore database
docker-compose exec database psql -U postgres saas_db < backup.sql
```

---

## 6. Environment Variables

### Backend .env
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-for-security
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration (for future notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Application Configuration
LOG_LEVEL=debug
API_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb
```

### Frontend .env
```
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api

# Application Environment
REACT_APP_ENV=development

# Optional: Analytics or third-party services
REACT_APP_GOOGLE_ANALYTICS_ID=
```

---

## 7. Code Style & Best Practices

### JavaScript/Node.js

**Naming Conventions:**
- **Variables/Functions:** camelCase (const userName, function getUserById)
- **Classes/Constructors:** PascalCase (class UserController)
- **Constants:** UPPER_SNAKE_CASE (const MAX_USERS_FREE = 5)
- **Files:** camelCase for modules (userService.js), PascalCase for components (UserForm.jsx)

**Code Organization:**
- Functions organized by concern (auth, validation, database)
- Middleware ordered by execution (bodyParser → cors → auth)
- Related functions grouped in services/controllers
- 80 character line length recommended
- 2-space indentation

**Error Handling:**
- Use try/catch for async operations
- Throw custom errors with descriptive messages
- Global error handler middleware catches all errors
- Never expose internal error details to client
- Log errors with context (userId, tenantId, endpoint)

**Database Queries:**
- Always use parameterized queries (? placeholders)
- Always include tenant_id filter
- Extract tenant_id from JWT, never from request body
- Use explicit column names (SELECT id, name FROM ..., not SELECT *)
- Add comments for complex queries

### React/Frontend

**Component Structure:**
- Functional components with hooks (not class components)
- One component per file
- Import/export at top of file
- Props validation with PropTypes (or TypeScript if available)
- Custom hooks for reusable logic

**State Management:**
- useContext for global state (Auth, Tenant)
- useState for local component state
- useEffect for side effects (API calls, subscriptions)
- Custom hooks to abstract complex logic

**File Organization:**
- components/ - Reusable UI components
- pages/ - Page-level components (mapped to routes)
- services/ - API client functions
- context/ - Global state
- hooks/ - Custom React hooks
- utils/ - Utility functions

---

## 8. Deployment Checklist

Before deploying to production:

- [ ] All 19 API endpoints tested and working
- [ ] All 6 frontend pages functional
- [ ] Database migrations run successfully
- [ ] Seed data loaded correctly
- [ ] Environment variables set (no hardcoded values)
- [ ] CORS configured for production domain
- [ ] JWT secret is strong and secure
- [ ] HTTPS enabled in production
- [ ] Health check endpoint responds correctly
- [ ] Error handling doesn't expose sensitive info
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging functional
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Documentation updated
- [ ] docker-compose.yml uses production-ready image versions
- [ ] No console.log statements left in production code

---

## 9. Troubleshooting Guide

### Common Issues

**Backend won't start:**
- Check if port 5000 is already in use: `lsof -i :5000`
- Verify database connection: `psql -h localhost -U postgres`
- Check .env file exists and has correct values
- Check migrations have run: `npm run migrate`

**Frontend can't connect to API:**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check CORS is configured: Look for REACT_APP_API_URL in .env
- Check browser console for CORS errors
- Verify JWT token is being sent in Authorization header

**Database connection failed:**
- Verify PostgreSQL is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Ensure database exists: `psql -l | grep saas_db`
- Check database has proper permissions

**Docker containers not starting:**
- Run `docker-compose logs -f` to see error messages
- Ensure ports 5432, 5000, 3000 are not in use
- Check Docker has enough resources (disk space, memory)
- Try `docker-compose down` then `docker-compose up -d` again

---

## 10. Performance Optimization Tips

- **Database Indexes:** Add indexes on frequently queried columns (tenant_id, user_id)
- **Connection Pooling:** Use connection pool to reuse database connections
- **Caching:** Implement Redis for frequently accessed data
- **Query Optimization:** Use EXPLAIN ANALYZE to identify slow queries
- **Frontend:** Lazy load components, optimize images, minimize bundle size
- **Compression:** Enable gzip compression on API responses
- **Pagination:** Implement pagination for large result sets

---

## 11. Security Hardening

- **Input Validation:** Validate all inputs on backend
- **Rate Limiting:** Implement per-IP rate limiting
- **SQL Injection:** Use parameterized queries everywhere
- **XSS Prevention:** Validate and sanitize HTML inputs
- **Password Policy:** Enforce minimum 8 characters
- **Session Timeout:** Auto-logout after 24 hours (JWT expiry)
- **HTTPS:** Enforce HTTPS in production
- **Headers:** Set security headers (CSP, X-Frame-Options, etc.)
- **Secrets Management:** Use environment variables for secrets
- **Dependency Updates:** Regularly update npm packages

