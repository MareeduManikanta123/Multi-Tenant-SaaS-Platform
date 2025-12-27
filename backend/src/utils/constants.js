module.exports = {
  // User roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    TENANT_ADMIN: 'tenant_admin',
    USER: 'user',
  },

  // Tenant status
  TENANT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
  },

  // Subscription plans
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
  },

  // Plan limits
  PLAN_LIMITS: {
    free: { max_users: 5, max_projects: 3 },
    pro: { max_users: 25, max_projects: 15 },
    enterprise: { max_users: 100, max_projects: 50 },
  },

  // Project status
  PROJECT_STATUS: {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    COMPLETED: 'completed',
  },

  // Task status
  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
  },

  // Task priority
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  // Audit actions
  AUDIT_ACTIONS: {
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    CREATE_PROJECT: 'CREATE_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    CREATE_TASK: 'CREATE_TASK',
    UPDATE_TASK: 'UPDATE_TASK',
    DELETE_TASK: 'DELETE_TASK',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    UPDATE_TENANT: 'UPDATE_TENANT',
  },
};
