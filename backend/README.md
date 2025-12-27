# Multi-Tenant SaaS Platform - Backend API

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 12+
- npm v9+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Create database (if not using Docker)
createdb saas_db

# Run migrations and seed data
npm run migrate
npm run seed

# Start development server
npm run dev
```

Server will run on http://localhost:5000

### Docker Setup

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Endpoints

### Authentication (4 endpoints)
- `POST /api/auth/register-tenant` - Register new organization
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Tenant Management (3 endpoints)
- `GET /api/tenants/:tenantId` - Get tenant details
- `PUT /api/tenants/:tenantId` - Update tenant
- `GET /api/tenants` - List all tenants (super admin only)

### User Management (4 endpoints)
- `POST /api/tenants/:tenantId/users` - Add user
- `GET /api/tenants/:tenantId/users` - List users
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Project Management (4 endpoints)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Task Management (4 endpoints)
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks
- `PATCH /api/tasks/:taskId/status` - Update status
- `PUT /api/tasks/:taskId` - Update task

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── controllers/     # Business logic
├── models/          # Database queries
├── utils/           # Helper functions
└── app.js           # Express app setup

database/
├── migrations/      # SQL migration files
└── seeds/           # Seed data
```

## Environment Variables

See `.env.example` for all available variables.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME` - Database connection
- `JWT_SECRET` - Secret for signing JWT tokens
- `FRONTEND_URL` - Frontend origin for CORS
- `PORT` - Server port (default: 5000)

## Database

### Migrations
```bash
npm run migrate
```

Automatically runs all migration files in order.

### Seeds
```bash
npm run seed
```

Populates database with demo data:
- Super admin user (superadmin@system.com / Admin@123)
- Demo tenant (subdomain: demo)
- Demo admin user (admin@demo.com / Demo@123)
- Demo regular users
- Sample projects and tasks

## Authentication

All endpoints except `/register-tenant` and `/login` require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Token includes:
- `userId` - User ID
- `tenantId` - Tenant ID (null for super admin)
- `role` - User role (super_admin, tenant_admin, user)

Token expiry: 24 hours

## Architecture

- **Multi-Tenant**: Each tenant's data isolated by tenant_id
- **JWT Authentication**: Stateless token-based auth
- **PostgreSQL**: Reliable RDBMS with transaction support
- **Bcrypt**: Password hashing with salt rounds 10

## Common Tasks

### Create a new user programmatically
```javascript
const pool = require('./src/config/database');
const { hashPassword } = require('./src/utils/password');

const password = await hashPassword('NewPassword@123');
await pool.query(
  `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [uuidv4(), 'tenant-id', 'user@example.com', password, 'User Name', 'user']
);
```

### Query user's projects
```javascript
const projects = await pool.query(
  'SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC',
  [tenantId]
);
```

### Check subscription limits
```javascript
const result = await pool.query(
  'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
  [tenantId]
);
const currentCount = parseInt(result.rows[0].count);
if (currentCount >= tenant.max_users) {
  // Limit reached
}
```

## Troubleshooting

### "connect ECONNREFUSED"
Database not running. Start PostgreSQL:
```bash
# macOS with Homebrew
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Or use Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
```

### "UNIQUE violation on (tenant_id, email)"
Email already exists in that tenant. Each tenant can have unique emails, but same email can't exist twice in same tenant.

### "JWT token invalid"
Token may be:
- Expired (24 hour expiry)
- Tampered (signature invalid)
- Malformed (not in Bearer format)

Resend Authorization header in correct format: `Bearer <token>`

## Production Deployment

1. Set environment variables in production:
   - `NODE_ENV=production`
   - Strong `JWT_SECRET`
   - Production database credentials
   - Production `FRONTEND_URL`

2. Ensure database backups are configured

3. Use process manager (PM2, systemd, etc)

4. Enable HTTPS/TLS

5. Implement rate limiting

6. Set up monitoring and alerting

7. Regular security audits

## Performance Tips

- Indexes on tenant_id columns (included in migrations)
- Use connection pooling (pg module does this)
- Pagination for large result sets
- Query optimization with EXPLAIN ANALYZE

## Security Considerations

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with HS256
- SQL injection prevention via parameterized queries
- CORS configured for frontend origin only
- Tenant isolation enforced at application level
- All important actions logged in audit_logs

