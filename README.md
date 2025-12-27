# SaaS Platform - Full-Stack Multi-Tenant Application

A production-ready, full-stack Software-as-a-Service (SaaS) platform with complete project and task management capabilities. Built with a modern tech stack featuring React, Node.js/Express, PostgreSQL, and Docker containerization.



## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd SaaS_platform_FSD

# Start all services (Database, Backend, Frontend)
docker-compose up -d

# Wait for services to initialize (30-40 seconds)
# Then access the application at: http://localhost:3000
```

The system will automatically:
- Initialize PostgreSQL database
- Run all database migrations
- Seed test data
- Start backend API server
- Serve frontend application

### Local Development Setup

#### Backend
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
# Backend available at: http://localhost:5000/api
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
# Frontend available at: http://localhost:3000
```

## ✨ Key Features

### Multi-Tenancy
- Complete data isolation between tenants
- Shared database with tenant_id-based filtering
- Automatic tenant context from JWT tokens
- Subdomain-based tenant identification

### Authentication & Authorization
- JWT-based authentication (24-hour expiry)
- Three-tier role-based access control:
  - **Super Admin**: System-wide access
  - **Tenant Admin**: Full tenant management
  - **User**: Limited project/task access
- Automatic token refresh and 401 error handling
- Session management with localStorage

### Project & Task Management
- Create, read, update, delete projects
- Hierarchical task management within projects
- Task filtering by status, priority, and assignee
- Due date tracking and priority levels
- Project status tracking (active/archived/completed)

### Subscription Plans
- Three-tier subscription system:
  - **Free**: 5 users, 3 projects
  - **Pro**: 25 users, 15 projects
  - **Enterprise**: 100 users, 50 projects
- Automatic plan limit enforcement
- Plan upgrade/downgrade support

### User Management
- Multi-user support per tenant
- Role assignment and status management
- User activity tracking
- Self-service user deletion with task reassignment

### Audit Logging
- Complete audit trail of all system changes
- User action tracking
- Resource modification history
- IP address and timestamp logging

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL 15
- **Authentication**: JWT (HS256)
- **Password Hashing**: Bcryptjs (10 salt rounds)
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router v6.20.0
- **HTTP Client**: Axios 1.6.2
- **Styling**: Tailwind CSS 3.4.1
- **Build Tool**: Vite 5.0.7
- **State Management**: React Context API

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend serving)
- **Database**: PostgreSQL 15 Alpine
- **Health Checks**: Built-in for all services

## 📁 Project Structure

```
SaaS_platform_FSD/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express application setup
│   │   ├── config/
│   │   │   └── database.js        # PostgreSQL configuration
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── authorize.js       # Role-based authorization
│   │   │   └── errorHandler.js    # Global error handling
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication endpoints
│   │   │   ├── tenants.js         # Tenant management
│   │   │   ├── users.js           # User management
│   │   │   ├── projects.js        # Project CRUD
│   │   │   └── tasks.js           # Task management
│   │   └── utils/
│   │       ├── jwt.js             # Token utilities
│   │       ├── password.js        # Password hashing
│   │       ├── validators.js      # Input validation
│   │       └── constants.js       # Application constants
│   ├── database/
│   │   ├── migrations/            # SQL migration files
│   │   └── seeds/                 # Initial data
│   ├── Dockerfile                 # Docker image for backend
│   ├── docker-entrypoint.sh       # Database initialization script
│   ├── package.json
│   ├── server.js                  # Entry point
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main application component
│   │   ├── main.jsx               # Entry point
│   │   ├── index.css              # Tailwind styles
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   └── ProtectedRoute.jsx # Route guard component
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication state
│   │   ├── services/
│   │   │   └── api.js             # API client with interceptors
│   │   └── pages/
│   │       ├── RegisterPage.jsx   # Tenant registration
│   │       ├── LoginPage.jsx      # User login
│   │       ├── DashboardPage.jsx  # Dashboard with stats
│   │       ├── ProjectsPage.jsx   # Project management
│   │       ├── ProjectDetailsPage.jsx # Project + tasks
│   │       └── UsersPage.jsx      # User management
│   ├── Dockerfile                 # Multi-stage Docker build
│   ├── nginx.conf                 # Nginx configuration
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── index.html
│   └── .env.example
│
├── docs/
│   ├── research.md                # Multi-tenancy research
│   ├── PRD.md                     # Product requirements
│   ├── technical-spec.md          # Technical specifications
│   ├── architecture.md            # System architecture
│   └── API.md                     # API documentation
│
├── docker-compose.yml             # Docker compose configuration
└── PROGRESS.md                    # Implementation progress
```

## 🔐 Authentication Flow

1. **Register Tenant**
   ```bash
   POST /api/auth/register-tenant
   {
     "tenantName": "Acme Corp",
     "subdomain": "acme",
     "email": "admin@acme.com",
     "password": "SecurePassword123",
     "fullName": "Admin User"
   }
   ```

2. **Login**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@acme.com",
     "password": "SecurePassword123",
     "tenantSubdomain": "acme"
   }
   ```

3. **Get Current User**
   ```bash
   GET /api/auth/me
   # Returns user with tenant info
   ```

4. **Token Usage**
   - Axios automatically injects JWT in `Authorization: Bearer <token>` header
   - Tokens valid for 24 hours
   - 401 responses trigger auto-logout and redirect to login

## 📊 API Endpoints (19 Total)

### Authentication (4 endpoints)
- `POST /api/auth/register-tenant` - Create new tenant
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Current user profile
- `POST /api/auth/logout` - Logout

### Tenants (3 endpoints)
- `GET /api/tenants/:tenantId` - Get tenant details
- `PUT /api/tenants/:tenantId` - Update tenant
- `GET /api/tenants` - List all tenants (super_admin only)

### Users (4 endpoints)
- `POST /api/tenants/:tenantId/users` - Add user to tenant
- `GET /api/tenants/:tenantId/users` - List tenant users
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Projects (4 endpoints)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Tasks (4 endpoints)
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks
- `PATCH /api/tasks/:taskId/status` - Update task status
- `PUT /api/tasks/:taskId` - Update task fully

See [docs/API.md](docs/API.md) for complete endpoint documentation with examples.

## 🧪 Test Credentials

### Super Admin (System Access)
```
Email: superadmin@system.com
Password: Admin@123
Tenant: N/A (system-wide)
Role: super_admin
```

### Demo Tenant
```
Tenant Name: Demo Company
Subdomain: demo
Status: Active
Plan: Pro (25 users, 15 projects)

Admin Account:
  Email: admin@demo.com
  Password: Demo@123
  Role: tenant_admin

User Accounts:
  Email: user1@demo.com
  Password: User@123
  Role: user

  Email: user2@demo.com
  Password: User@123
  Role: user

Sample Data:
  i add some more projects
  Projects: 5+ (Alpha, Beta, mi,rcb........)
  Tasks: 5+ (across projects)
```

## 🐳 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Rebuild Images
```bash
docker-compose up -d --build
```

### Database Access
```bash
docker exec -it saas_database psql -U saas_user -d saas_platform
```

## 🔄 Database Schema

### Tables
- **tenants** - Multi-tenant information
- **users** - User accounts with tenant relationships
- **projects** - Project management
- **tasks** - Task tracking within projects
- **audit_logs** - Comprehensive audit trail

### Key Features
- UNIQUE constraints for email per tenant
- Composite indexes for performance
- Cascade deletes for data consistency
- Transaction support for atomic operations

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_secret_key_minimum_32_characters
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000
NODE_PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Production Deployment

### Environment Setup
1. Update `docker-compose.yml` with production environment variables
2. Change `JWT_SECRET` to a secure random value (minimum 32 characters)
3. Update `CORS_ORIGIN` to your production domain
4. Use environment-specific `.env` files

### Database
1. Consider managed PostgreSQL service (AWS RDS, Azure Database)
2. Enable SSL/TLS connections
3. Set up automated backups
4. Monitor query performance

### Security
- Use HTTPS with valid SSL certificate
- Implement rate limiting
- Enable CORS for specific domains only
- Add Web Application Firewall (WAF)
- Regular security updates for dependencies

## 🐛 Troubleshooting

### Docker Services Not Starting
```bash
# Check logs
docker-compose logs -f

# Ensure ports are not in use
lsof -i :3000 :5000 :5432
```

### Database Connection Error
```bash
# Check if database container is healthy
docker-compose ps

# Verify database is ready
docker exec saas_database pg_isready
```

### Frontend Cannot Connect to Backend
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check `VITE_API_URL` in frontend `.env`
- Ensure CORS is configured correctly in backend

### Migration or Seed Failed
```bash
# Check Docker logs for details
docker-compose logs backend

# Can retry migrations manually
docker exec saas_backend npm run migrate
```

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete endpoint reference
- [Architecture Design](docs/architecture.md) - System design and diagrams
- [Technical Specification](docs/technical-spec.md) - Implementation details
- [Product Requirements](docs/PRD.md) - Feature specifications

## 🎯 Core Responsibilities

### Multi-Tenancy
- All database queries automatically filtered by tenant_id from JWT
- No client-provided tenant_id parameters accepted
- Data completely isolated between tenants

### Authorization
- Every endpoint checks user role and permissions
- Cross-tenant access returns 403 Forbidden
- Self-modification restrictions enforced

### Data Consistency
- Transactions for multi-step operations
- Cascade deletes for referential integrity
- Validation at both client and server

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Docker container logs: `docker-compose logs`
3. Verify test credentials are correct
4. Check API documentation for endpoint specifics

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create pull request

---

