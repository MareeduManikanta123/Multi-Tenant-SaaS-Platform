# 🚀 Quick Reference Guide

## Start the Application

```bash
docker-compose up -d
```

**Wait 30-40 seconds for services to initialize.**

## Access the Application

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |
| Database | localhost:5432 |

## Test Credentials

### Super Admin (System-wide access)
```
Email: superadmin@system.com
Password: Admin@123
```

### Demo Tenant Admin
```
Subdomain: demo
Email: admin@demo.com
Password: Demo@123
```

### Demo Tenant Users (4 regular users)
```
Email: user1@demo.com, user2@demo.com, user3@demo.com, user4@demo.com
Password: User@123 (all)
```

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only
docker-compose logs -f database     # Database only
```

### Stop Services
```bash
docker-compose down
```

### Stop & Remove Volumes
```bash
docker-compose down -v
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild Images
```bash
docker-compose up -d --build
```

### Check Service Status
```bash
docker-compose ps
```

### Database Access
```bash
docker exec -it saas_database psql -U saas_user -d saas_platform
```

## Useful Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register New Tenant
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corp",
    "subdomain": "acme",
    "email": "admin@acme.com",
    "password": "SecurePassword123",
    "fullName": "Admin User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

## File Structure Quick Reference

```
SaaS_platform_FSD/
├── backend/
│   ├── src/
│   │   ├── app.js                 ← Express setup
│   │   ├── routes/                ← 5 API route modules
│   │   ├── middleware/            ← Auth, authorize, error handling
│   │   └── utils/                 ← JWT, password, validators
│   ├── database/
│   │   ├── migrations/            ← 5 SQL migration files
│   │   └── seeds/                 ← Test data seeding
│   ├── Dockerfile                 ← Backend container
│   ├── docker-entrypoint.sh       ← Auto initialization
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 ← 6 main pages
│   │   ├── components/            ← Navbar, ProtectedRoute
│   │   ├── context/               ← AuthContext
│   │   └── services/              ← API client
│   ├── Dockerfile                 ← Frontend container
│   ├── nginx.conf                 ← Web server config
│   └── package.json
│
├── docs/
│   ├── research.md                ← Multi-tenancy research
│   ├── PRD.md                     ← Product requirements
│   ├── technical-spec.md          ← Technical details
│   ├── architecture.md            ← System architecture
│   └── API.md                     ← API documentation
│
├── docker-compose.yml             ← All services
├── README.md                      ← Main documentation
├── PROGRESS.md                    ← Implementation progress
├── COMPLETION_SUMMARY.md          ← This project summary
└── submission.json                ← Test credentials & guide
```

## Development (Without Docker)

### Backend
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Environment Files

### Backend (.env)
```
NODE_ENV=production
DATABASE_URL=postgresql://saas_user:saas_password_secure@database:5432/saas_platform
JWT_SECRET=your_super_secret_jwt_key_change_in_production_minimum_32_chars
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000
NODE_PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Credentials (Default)

```
Host: database (or localhost)
Port: 5432
Database: saas_platform
User: saas_user
Password: saas_password_secure
```

## API Endpoints (19 Total)

### Authentication (4)
- `POST /api/auth/register-tenant`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Tenants (3)
- `GET /api/tenants/:tenantId`
- `PUT /api/tenants/:tenantId`
- `GET /api/tenants`

### Users (4)
- `POST /api/tenants/:tenantId/users`
- `GET /api/tenants/:tenantId/users`
- `PUT /api/users/:userId`
- `DELETE /api/users/:userId`

### Projects (4)
- `POST /api/projects`
- `GET /api/projects`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Tasks (4)
- `POST /api/projects/:projectId/tasks`
- `GET /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId/status`
- `PUT /api/tasks/:taskId`

## Key Features

✅ Multi-tenant SaaS platform
✅ JWT authentication (24-hour expiry)
✅ Role-based access control (3 tiers)
✅ Project and task management
✅ Subscription plans (Free/Pro/Enterprise)
✅ User management with team support
✅ Audit logging
✅ Responsive React frontend
✅ Docker containerization
✅ Automatic database initialization

## Troubleshooting

### Ports Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Docker Issues
```bash
# Check logs
docker-compose logs -f

# Rebuild everything
docker-compose down -v
docker-compose up -d --build
```

### Database Connection Error
```bash
# Check if database is ready
docker exec saas_database pg_isready

# Check database logs
docker-compose logs database
```

### Frontend Can't Connect to Backend
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check `.env` file has correct `VITE_API_URL`
- Ensure CORS is configured (it is by default)

## Authentication Flow

1. **Register Tenant** → Creates tenant + admin user
2. **Login** → Get JWT token (24-hour expiry)
3. **API Calls** → Include `Authorization: Bearer <token>` header (automatic)
4. **Token Expires** → Auto-logout and redirect to login

## Important Notes

- All database queries automatically filtered by tenant_id from JWT
- Cross-tenant access returns 403 Forbidden
- Passwords never stored in plaintext (bcryptjs hashing)
- Subscription limits enforced on resource creation
- Deleted users' tasks automatically reassigned
- All changes logged for audit trail

## Production Checklist

- [ ] Change `JWT_SECRET` to a secure random string (min 32 chars)
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Use managed PostgreSQL service (AWS RDS, Azure Database)
- [ ] Enable SSL/TLS for database connections
- [ ] Set up automated database backups
- [ ] Use HTTPS with valid SSL certificate
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates for dependencies

## Getting Help

1. Check `COMPLETION_SUMMARY.md` for detailed overview
2. Review `README.md` for comprehensive documentation
3. See `submission.json` for test scenarios and credentials
4. Check `docs/API.md` for endpoint details
5. Review logs with `docker-compose logs -f`

---

**Everything is ready to use!** 🚀
