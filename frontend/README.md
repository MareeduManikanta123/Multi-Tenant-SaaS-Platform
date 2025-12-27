# SaaS Platform - Frontend

A React-based frontend for the multi-tenant SaaS project and task management platform.

## Features

- **Multi-tenant authentication** with JWT tokens
- **User registration** and login with tenant creation
- **Dashboard** with statistics and recent projects
- **Project management** - Create, view, update, and delete projects
- **Task management** - Create, assign, and manage tasks within projects
- **User management** - Add, update, and manage tenant users
- **Role-based access control** - Different permissions for user and admin roles
- **Responsive design** with Tailwind CSS

## Tech Stack

- **React 18.2** - UI library
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool and dev server

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Main navigation bar
│   └── ProtectedRoute.jsx      # Route protection wrapper
├── context/
│   └── AuthContext.jsx         # Authentication state management
├── pages/
│   ├── RegisterPage.jsx        # Tenant registration
│   ├── LoginPage.jsx           # User login
│   ├── DashboardPage.jsx       # Dashboard with stats
│   ├── ProjectsPage.jsx        # Projects list and creation
│   ├── ProjectDetailsPage.jsx  # Project details and tasks
│   └── UsersPage.jsx           # User management
├── services/
│   └── api.js                  # API client and service functions
├── App.jsx                     # Main app component
├── main.jsx                    # Entry point
└── index.css                   # Tailwind CSS and custom styles
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:5000/api`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (or use `.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## API Integration

The frontend communicates with the backend via REST API endpoints. All API calls are made through the `api.js` service module, which includes:

- **Authentication** - Register, login, logout
- **Tenants** - Get tenant info, update, list all
- **Users** - Add users, list, update, delete
- **Projects** - Create, list, update, delete
- **Tasks** - Create, list, update status

### API Service Structure

```javascript
// Authentication
authService.registerTenant(data)
authService.login(data)
authService.getCurrentUser()
authService.logout()

// Tenants
tenantService.getTenant(tenantId)
tenantService.updateTenant(tenantId, data)
tenantService.listTenants(params)
tenantService.addUser(tenantId, data)
tenantService.listUsers(tenantId, params)

// Users
userService.updateUser(userId, data)
userService.deleteUser(userId)

// Projects
projectService.createProject(data)
projectService.listProjects(params)
projectService.updateProject(projectId, data)
projectService.deleteProject(projectId)

// Tasks
taskService.createTask(projectId, data)
taskService.listTasks(projectId, params)
taskService.updateTaskStatus(taskId, status)
taskService.updateTask(taskId, data)
```

## Authentication Flow

1. **Register Page** - Create new tenant with admin user
   - Form collects: Tenant name, subdomain, admin email, password, full name
   - Validates email format, subdomain uniqueness, password strength
   - Creates tenant and stores admin credentials

2. **Login Page** - Authenticate with email, password, and tenant subdomain
   - Validates input format
   - Receives JWT token from backend
   - Stores token and user info in localStorage

3. **Protected Routes** - All routes except `/register` and `/login` require authentication
   - `ProtectedRoute` component checks for valid token
   - Redirects to login if not authenticated
   - Auto-logout on 401 response (token expired/invalid)

4. **Token Management**
   - JWT token stored in `localStorage.authToken`
   - User info stored in `localStorage.user`
   - Automatically added to all API requests via axios interceptor
   - Cleared on logout

## Authentication Context

The `AuthContext` provides authentication state and methods:

```javascript
const { 
  user,              // Current user object
  loading,           // Loading state
  error,             // Error message if any
  register,          // Register new tenant
  login,             // Login user
  logout,            // Logout user
  refreshUser,       // Refresh user profile
  isAuthenticated    // Boolean auth status
} = useAuth();
```

## Features & Pages

### Dashboard
- Welcome message with user and tenant info
- Statistics cards: Total users, projects, tasks
- Subscription plan and status display
- Recent projects preview

### Projects
- List all projects in the tenant
- Create new project with name and description
- Quick view of task count per project
- Delete projects (with confirmation)
- Status indicator (active, archived, completed)

### Project Details
- View full project details
- Create and manage tasks within the project
- Task list with status dropdown
- Priority indicators (low, medium, high)
- Due date display

### Users
- List all users in the tenant (admin view)
- Add new users with role assignment
- Update user roles (admin only)
- Delete users (admin only)
- Display user status (active/inactive)

## Error Handling

- Form validation on client-side before submission
- API error messages displayed in alerts/toasts
- 401 errors trigger automatic logout and redirect to login
- User-friendly error messages for common scenarios

## Styling

- **Tailwind CSS** for responsive design
- **Custom utility classes** for consistent button and input styles
- **Mobile-first responsive layout**
- **Color scheme** - Blue primary, with red for danger and green for success

## Performance Considerations

- Lazy loading of pages via React Router
- Pagination support for lists (projects, users, tasks)
- Efficient state management with React hooks
- API response caching where applicable

## Security

- JWT token-based authentication
- Secure password input fields
- Token stored in localStorage (accessible via JS)
- CORS configured on backend for frontend domain
- No sensitive data in localStorage except JWT

## Troubleshooting

### CORS Errors
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_URL` in `.env`
- Verify CORS is enabled in backend

### 401 Unauthorized
- Token may be expired (24-hour expiry)
- Try logging in again
- Clear localStorage and restart

### API Connection Issues
- Verify backend is running
- Check network tab in browser DevTools
- Ensure API URL is correct in `.env`

## Development Tips

- Use `npm run dev` for development with hot reload
- Check browser console for errors and logs
- Use `npm run build` to test production build
- Use `npm run preview` to serve production build locally

## Next Steps

- Implement persistence of API state across browser refreshes
- Add toast notifications for user feedback
- Implement search and advanced filtering
- Add task assignment to specific users
- Implement real-time updates with WebSockets
- Add file upload support

