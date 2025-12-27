import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authService = {
  registerTenant: (data) =>
    apiClient.post('/auth/register-tenant', data),
  
  login: (data) =>
    apiClient.post('/auth/login', data),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
  
  logout: () =>
    apiClient.post('/auth/logout'),
};

// Tenant API
export const tenantService = {
  getTenant: (tenantId) =>
    apiClient.get(`/tenants/${tenantId}`),
  
  updateTenant: (tenantId, data) =>
    apiClient.put(`/tenants/${tenantId}`, data),
  
  listTenants: (params) =>
    apiClient.get('/tenants', { params }),
  
  addUser: (tenantId, data) =>
    apiClient.post(`/tenants/${tenantId}/users`, data),
  
  listUsers: (tenantId, params) =>
    apiClient.get(`/tenants/${tenantId}/users`, { params }),
};

// User API
export const userService = {
  updateUser: (userId, data) =>
    apiClient.put(`/users/${userId}`, data),
  
  deleteUser: (userId) =>
    apiClient.delete(`/users/${userId}`),
};

// Project API
export const projectService = {
  createProject: (data) =>
    apiClient.post('/projects', data),
  
  listProjects: (params) =>
    apiClient.get('/projects', { params }),
  
  updateProject: (projectId, data) =>
    apiClient.put(`/projects/${projectId}`, data),
  
  deleteProject: (projectId) =>
    apiClient.delete(`/projects/${projectId}`),
};

// Task API
export const taskService = {
  createTask: (projectId, data) =>
    apiClient.post(`/projects/${projectId}/tasks`, data),
  
  listTasks: (projectId, params) =>
    apiClient.get(`/projects/${projectId}/tasks`, { params }),
  
  updateTaskStatus: (taskId, status) =>
    apiClient.patch(`/tasks/${taskId}/status`, { status }),
  
  updateTask: (taskId, data) =>
    apiClient.put(`/tasks/${taskId}`, data),
  
  deleteTask: (taskId) =>
    apiClient.delete(`/tasks/${taskId}`),
};

export default apiClient;
