# SaaS Platform - API Documentation

## Overview

This document describes all 19 API endpoints for the multi-tenant SaaS platform. The API uses RESTful conventions with JSON request/response bodies.

**Base URL**: `http://localhost:5000/api` (development) or `https://api.saasplatform.com` (production)

**Authentication**: All endpoints except `/auth/register-tenant` and `/auth/login` require a JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

**Response Format**: All responses follow a consistent format:
```json
{
  "success": boolean,
  "message": "string (optional)",
  "data": "object or array (optional)",
  "pagination": "object (optional)"
}
```

**Error Codes**:
- `400`: Bad Request - Invalid input or validation failure
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Business logic constraint violation (e.g., duplicate email, limit reached)
- `500`: Internal Server Error - Unexpected server error

---

## Module 1: Authentication (4 endpoints)

### 1. Register Tenant
**POST** `/auth/register-tenant`

Create a new tenant and initialize the tenant admin user.

**Request Body**:
```json
{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass123",
  "adminFullName": "John Doe"
}
```

**Validation Rules**:
- `tenantName`: Required, string, 1-255 characters
- `subdomain`: Required, alphanumeric + hyphens, 3-63 characters, must be unique across all tenants
- `adminEmail`: Required, valid email format, must be unique within tenant
- `adminPassword`: Required, minimum 8 characters
- `adminFullName`: Required, string, 1-255 characters

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Acme Corporation",
    "subdomain": "acme",
    "subscriptionPlan": "free",
    "maxUsers": 5,
    "maxProjects": 3,
    "adminUser": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "admin@acme.com",
      "fullName": "John Doe",
      "role": "tenant_admin"
    }
  }
}
```

**Error Responses**:
- `400`: Invalid email format, weak password, subdomain already exists
- `409`: Subdomain already taken

---

### 2. Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@acme.com",
  "password": "UserPassword123",
  "tenantSubdomain": "acme"
}
```

**Alternative** (using tenantId instead of subdomain):
```json
{
  "email": "user@acme.com",
  "password": "UserPassword123",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "user@acme.com",
      "fullName": "John Doe",
      "role": "tenant_admin",
      "isActive": true,
      "tenantId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Error Responses**:
- `400`: Missing required fields, tenant not found
- `401`: Invalid credentials (generic message for security)
- `403`: Tenant is inactive

---

### 3. Get Current User
**GET** `/auth/me`

Retrieve the authenticated user's profile.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "user@acme.com",
    "fullName": "John Doe",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

**Error Responses**:
- `401`: Invalid or expired token
- `404`: User not found

---

### 4. Logout
**POST** `/auth/logout`

Logout the current user. (JWT-based, client removes token)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Module 2: Tenant Management (3 endpoints)

### 5. Get Tenant Details
**GET** `/tenants/:tenantId`

Retrieve tenant details and statistics.

**Parameters**:
- `tenantId`: UUID of the tenant

**Authorization**:
- User can view their own tenant
- Super admin can view any tenant

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "subdomain": "acme",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "totalUsers": 5,
    "totalProjects": 3,
    "totalTasks": 12,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `403`: Access denied (not tenant member or admin)
- `404`: Tenant not found

---

### 6. Update Tenant
**PUT** `/tenants/:tenantId`

Update tenant information.

**Parameters**:
- `tenantId`: UUID of the tenant

**Authorization**:
- Tenant admin can update name only
- Super admin can update all fields

**Request Body** (tenant admin):
```json
{
  "name": "Acme Corp Updated"
}
```

**Request Body** (super admin):
```json
{
  "name": "Acme Corp Updated",
  "status": "active",
  "subscriptionPlan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 50
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corp Updated",
    "subdomain": "acme",
    "status": "active",
    "subscriptionPlan": "enterprise",
    "maxUsers": 100,
    "maxProjects": 50,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Allowed Status Values**: `active`, `suspended`, `inactive`
**Allowed Plans**: `free`, `pro`, `enterprise`

**Error Responses**:
- `400`: Invalid input (enum values, required fields)
- `403`: Insufficient permissions
- `404`: Tenant not found

---

### 7. List Tenants (Super Admin Only)
**GET** `/tenants`

List all tenants in the system with pagination and filtering.

**Authorization**: Super admin only

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page, max 100 (default: 10)
- `status`: Filter by status (`active`, `suspended`, `inactive`)
- `plan`: Filter by subscription plan (`free`, `pro`, `enterprise`)

**Example Request**:
```
GET /api/tenants?page=1&limit=10&status=active&plan=pro
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "subdomain": "acme",
      "status": "active",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `403`: Only super admin can access this endpoint

---

## Module 3: User Management (4 endpoints)

### 8. Add User to Tenant
**POST** `/tenants/:tenantId/users`

Create a new user in a specific tenant.

**Parameters**:
- `tenantId`: UUID of the tenant

**Authorization**: Tenant admin or super admin

**Request Body**:
```json
{
  "email": "newuser@acme.com",
  "fullName": "Jane Smith",
  "password": "SecurePass456",
  "role": "user"
}
```

**Validation Rules**:
- `email`: Required, valid email format, unique within tenant
- `fullName`: Required, string, 1-255 characters
- `password`: Required, minimum 8 characters
- `role`: Optional, defaults to `user`. Allowed: `user`, `tenant_admin`

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@acme.com",
    "fullName": "Jane Smith",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-15T10:45:00Z",
    "updatedAt": "2024-01-15T10:45:00Z"
  }
}
```

**Error Responses**:
- `400`: Invalid email, weak password, email already exists in tenant
- `403`: Insufficient permissions
- `404`: Tenant not found
- `409`: User limit reached for tenant

---

### 9. List Users in Tenant
**GET** `/tenants/:tenantId/users`

List all users in a specific tenant.

**Parameters**:
- `tenantId`: UUID of the tenant

**Authorization**: Tenant admin or super admin (viewing their tenant members)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page, max 100 (default: 10)
- `search`: Search by email or full name (partial match, case-insensitive)
- `role`: Filter by role (`user`, `tenant_admin`)

**Example Request**:
```
GET /api/tenants/550e8400-e29b-41d4-a716-446655440000/users?page=1&search=jane&role=user
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "jane@acme.com",
      "fullName": "Jane Smith",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-15T10:45:00Z",
      "updatedAt": "2024-01-15T10:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `403`: Access denied
- `404`: Tenant not found

---

### 10. Update User
**PUT** `/users/:userId`

Update user information.

**Parameters**:
- `userId`: UUID of the user

**Authorization**:
- Users can update their own `fullName`
- Tenant admin can update `role` and `isActive` for users in their tenant
- Super admin can update any user's fields

**Request Body** (user updating own profile):
```json
{
  "fullName": "Jane Smith Updated"
}
```

**Request Body** (admin updating user):
```json
{
  "fullName": "Jane Smith",
  "role": "tenant_admin",
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane@acme.com",
    "fullName": "Jane Smith Updated",
    "role": "tenant_admin",
    "isActive": true,
    "createdAt": "2024-01-15T10:45:00Z",
    "updatedAt": "2024-01-15T10:50:00Z"
  }
}
```

**Restrictions**:
- Cannot change own role
- Cannot deactivate own account
- Only admins can update role/isActive

**Error Responses**:
- `400`: Invalid role enum, no fields to update
- `403`: Cannot modify other users or own role/status
- `404`: User not found

---

### 11. Delete User
**DELETE** `/users/:userId`

Delete a user and reassign their tasks.

**Parameters**:
- `userId`: UUID of the user to delete

**Authorization**: Tenant admin or super admin

**Special Behavior**:
- Prevents self-deletion
- Sets all tasks assigned to the user to have `assigned_to = NULL`
- User is completely removed from the database

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses**:
- `403`: Cannot delete own account, insufficient permissions
- `404`: User not found

---

## Module 4: Project Management (4 endpoints)

### 12. Create Project
**POST** `/projects`

Create a new project in the authenticated user's tenant.

**Authorization**: Any authenticated user in the tenant

**Request Body**:
```json
{
  "name": "Website Redesign",
  "description": "Redesign company website"
}
```

**Validation Rules**:
- `name`: Required, string, 1-255 characters
- `description`: Optional, string, up to 1000 characters

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Website Redesign",
    "description": "Redesign company website",
    "status": "active",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses**:
- `400`: Missing required fields
- `404`: Tenant not found
- `409`: Project limit reached for subscription plan

---

### 13. List Projects
**GET** `/projects`

List projects in the authenticated user's tenant.

**Authorization**: Any authenticated user

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page, max 100 (default: 10)
- `status`: Filter by status (`active`, `archived`, `completed`)
- `search`: Search by project name (partial match, case-insensitive)

**Example Request**:
```
GET /api/projects?page=1&status=active&search=website
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Website Redesign",
      "description": "Redesign company website",
      "status": "active",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001",
      "taskCount": 8,
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 14. Update Project
**PUT** `/projects/:projectId`

Update project information.

**Parameters**:
- `projectId`: UUID of the project

**Authorization**:
- Project creator can update
- Tenant admin can update
- Other users cannot update

**Request Body**:
```json
{
  "name": "Website Redesign Phase 2",
  "description": "Redesign company website - Phase 2",
  "status": "in_progress"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Website Redesign Phase 2",
    "description": "Redesign company website - Phase 2",
    "status": "in_progress",
    "createdBy": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:05:00Z"
  }
}
```

**Allowed Status Values**: `active`, `archived`, `completed`

**Error Responses**:
- `400`: Invalid enum values, required fields
- `403`: Insufficient permissions
- `404`: Project not found

---

### 15. Delete Project
**DELETE** `/projects/:projectId`

Delete a project and all its associated tasks.

**Parameters**:
- `projectId`: UUID of the project

**Authorization**:
- Project creator can delete
- Tenant admin can delete
- Other users cannot delete

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Cascade Behavior**:
- All tasks in the project are automatically deleted
- All audit log entries are preserved for compliance

**Error Responses**:
- `403`: Insufficient permissions
- `404`: Project not found

---

## Module 5: Task Management (4 endpoints)

### 16. Create Task
**POST** `/projects/:projectId/tasks`

Create a new task in a project.

**Parameters**:
- `projectId`: UUID of the project

**Authorization**: Any tenant member can create tasks

**Request Body**:
```json
{
  "title": "Design homepage mockup",
  "description": "Create Figma mockups for the new homepage",
  "priority": "high",
  "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
  "dueDate": "2024-02-15"
}
```

**Validation Rules**:
- `title`: Required, string, 1-255 characters
- `description`: Optional, string, up to 2000 characters
- `priority`: Optional, defaults to `medium`. Allowed: `low`, `medium`, `high`
- `assignedTo`: Optional UUID of a user in the same tenant
- `dueDate`: Optional, ISO 8601 date format (YYYY-MM-DD)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "projectId": "550e8400-e29b-41d4-a716-446655440010",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design homepage mockup",
    "description": "Create Figma mockups for the new homepage",
    "status": "todo",
    "priority": "high",
    "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
    "dueDate": "2024-02-15",
    "createdAt": "2024-01-15T11:10:00Z",
    "updatedAt": "2024-01-15T11:10:00Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input (assigned user not in tenant, invalid priority)
- `404`: Project not found

---

### 17. List Tasks in Project
**GET** `/projects/:projectId/tasks`

List tasks in a specific project with filtering and sorting.

**Parameters**:
- `projectId`: UUID of the project

**Authorization**: Tenant members can view

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page, max 100 (default: 10)
- `status`: Filter by task status (`todo`, `in_progress`, `done`)
- `priority`: Filter by priority (`low`, `medium`, `high`)
- `assignedTo`: Filter by assigned user ID
- `search`: Search by task title (partial match)

**Example Request**:
```
GET /api/projects/550e8400-e29b-41d4-a716-446655440010/tasks?status=in_progress&priority=high
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "projectId": "550e8400-e29b-41d4-a716-446655440010",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Design homepage mockup",
      "description": "Create Figma mockups for the new homepage",
      "status": "in_progress",
      "priority": "high",
      "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
      "dueDate": "2024-02-15",
      "createdAt": "2024-01-15T11:10:00Z",
      "updatedAt": "2024-01-15T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Sorting**: Results are automatically sorted by:
1. Priority (high → medium → low)
2. Due date (earliest first, nulls last)
3. Created date (newest first)

**Error Responses**:
- `403`: Access denied (not in tenant)
- `404`: Project not found

---

### 18. Update Task Status (Quick Update)
**PATCH** `/tasks/:taskId/status`

Quickly update only the status of a task.

**Parameters**:
- `taskId`: UUID of the task

**Authorization**: Any tenant member can update status

**Request Body**:
```json
{
  "status": "in_progress"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "projectId": "550e8400-e29b-41d4-a716-446655440010",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design homepage mockup",
    "description": "Create Figma mockups for the new homepage",
    "status": "in_progress",
    "priority": "high",
    "assignedTo": "550e8400-e29b-41d4-a716-446655440002",
    "dueDate": "2024-02-15",
    "createdAt": "2024-01-15T11:10:00Z",
    "updatedAt": "2024-01-15T11:20:00Z"
  }
}
```

**Allowed Status Values**: `todo`, `in_progress`, `done`

**Error Responses**:
- `400`: Invalid status enum
- `404`: Task not found

---

### 19. Update Task (Full Update)
**PUT** `/tasks/:taskId`

Update all fields of a task.

**Parameters**:
- `taskId`: UUID of the task

**Authorization**: Any tenant member can update

**Request Body**:
```json
{
  "title": "Design homepage mockup - Updated",
  "description": "Create detailed Figma mockups for the new homepage",
  "status": "done",
  "priority": "medium",
  "assignedTo": "550e8400-e29b-41d4-a716-446655440003",
  "dueDate": "2024-02-20"
}
```

**Special Behavior**:
- All fields are optional (partial updates supported)
- Set `assignedTo` to `null` to unassign a task
- Cannot assign to a user in a different tenant

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "projectId": "550e8400-e29b-41d4-a716-446655440010",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design homepage mockup - Updated",
    "description": "Create detailed Figma mockups for the new homepage",
    "status": "done",
    "priority": "medium",
    "assignedTo": "550e8400-e29b-41d4-a716-446655440003",
    "dueDate": "2024-02-20",
    "createdAt": "2024-01-15T11:10:00Z",
    "updatedAt": "2024-01-15T11:25:00Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input, assigned user not in tenant
- `404`: Task not found

---

## Authentication & Authorization

### JWT Token Structure
Tokens are signed using HS256 with a 24-hour expiry.

**Payload**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "tenant_admin",
  "iat": 1705328400,
  "exp": 1705414800
}
```

### Authorization Levels
- **Super Admin** (`role: super_admin`, `tenantId: null`): Can access all system resources
- **Tenant Admin** (`role: tenant_admin`): Can manage their tenant and all tenant resources
- **Regular User** (`role: user`): Limited to resources they have access to in their tenant

### Role-Based Access Control (RBAC)

| Endpoint | Super Admin | Tenant Admin | User |
|----------|-------------|-------------|------|
| Register Tenant | ❌ | ❌ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Get Current User | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ |
| Get Tenant | ✅ | ✅ own | ✅ own |
| Update Tenant | ✅ all fields | ✅ name only | ❌ |
| List Tenants | ✅ | ❌ | ❌ |
| Add User | ✅ | ✅ own | ❌ |
| List Users | ✅ | ✅ own | ❌ |
| Update User | ✅ | ✅ own | ✅ own name |
| Delete User | ✅ | ✅ own | ❌ |
| Create Project | ✅ | ✅ | ✅ |
| List Projects | ✅ | ✅ | ✅ |
| Update Project | ✅ | ✅ | ✅ creator only |
| Delete Project | ✅ | ✅ | ✅ creator only |
| Create Task | ✅ | ✅ | ✅ |
| List Tasks | ✅ | ✅ | ✅ |
| Update Task Status | ✅ | ✅ | ✅ |
| Update Task | ✅ | ✅ | ✅ |

---

## Data Isolation & Multi-Tenancy

All requests are automatically filtered by `tenantId` extracted from the JWT token. It is impossible for a user to access data from another tenant via the API.

**Automatic Filtering Rules**:
- When listing users, projects, or tasks, only records belonging to the user's tenant are returned
- Cross-tenant IDs in requests (e.g., assigning a task to a user from another tenant) are rejected with a 400 error
- Deleted users don't break referential integrity; their tasks are reassigned to `assigned_to = NULL`

---

## Rate Limiting & Quotas

- No rate limiting implemented (can be added per deployment requirements)
- Subscription plan limits enforced at creation time:
  - **Free**: 5 users, 3 projects
  - **Pro**: 25 users, 15 projects
  - **Enterprise**: 100 users, 50 projects

---

## Error Handling

All errors follow the consistent response format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### Common Error Messages
- `Invalid UUID format` - Malformed ID in URL
- `Invalid email format` - Email doesn't match regex
- `Password must be at least 8 characters` - Password too short
- `Email already exists in this tenant` - Duplicate email within tenant
- `User limit reached` - Subscription quota exceeded
- `Invalid status. Allowed values: active, archived, completed` - Invalid enum value
- `Access denied` - User lacks permission for requested action
- `User not found in this tenant` - Referenced user in different tenant

---

## Testing the API

### Using cURL

**Register Tenant**:
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Corp",
    "subdomain": "testcorp",
    "adminEmail": "admin@testcorp.com",
    "adminPassword": "Admin@123",
    "adminFullName": "Test Admin"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testcorp.com",
    "password": "Admin@123",
    "tenantSubdomain": "testcorp"
  }'
```

**Get Current User**:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Get Tenants (Super Admin)**:
```bash
curl -X GET "http://localhost:5000/api/tenants?page=1&limit=10" \
  -H "Authorization: Bearer <super_admin_token>"
```

---

## API Endpoint Summary

| # | Method | Endpoint | Name |
|---|--------|----------|------|
| 1 | POST | `/auth/register-tenant` | Register Tenant |
| 2 | POST | `/auth/login` | Login |
| 3 | GET | `/auth/me` | Get Current User |
| 4 | POST | `/auth/logout` | Logout |
| 5 | GET | `/tenants/:tenantId` | Get Tenant Details |
| 6 | PUT | `/tenants/:tenantId` | Update Tenant |
| 7 | GET | `/tenants` | List Tenants |
| 8 | POST | `/tenants/:tenantId/users` | Add User |
| 9 | GET | `/tenants/:tenantId/users` | List Users |
| 10 | PUT | `/users/:userId` | Update User |
| 11 | DELETE | `/users/:userId` | Delete User |
| 12 | POST | `/projects` | Create Project |
| 13 | GET | `/projects` | List Projects |
| 14 | PUT | `/projects/:projectId` | Update Project |
| 15 | DELETE | `/projects/:projectId` | Delete Project |
| 16 | POST | `/projects/:projectId/tasks` | Create Task |
| 17 | GET | `/projects/:projectId/tasks` | List Tasks |
| 18 | PATCH | `/tasks/:taskId/status` | Update Task Status |
| 19 | PUT | `/tasks/:taskId` | Update Task |

