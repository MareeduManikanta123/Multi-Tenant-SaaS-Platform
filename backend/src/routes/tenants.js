const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { isSuperAdmin, isTenantAdmin, requireRole } = require('../middleware/authorize');
const { isValidEmail, isValidPassword, isValidUUID, validateRequired, isValidEnum } = require('../utils/validators');
const { TENANT_STATUS, SUBSCRIPTION_PLANS, ROLES } = require('../utils/constants');

/**
 * GET /api/tenants/:tenantId
 * Get tenant details with statistics
 * Any user can view their own tenant, super_admin can view any tenant
 */
router.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Validate UUID format
    if (!isValidUUID(tenantId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID format' });
    }

    // Check authorization: user can only view their own tenant or be super_admin
    if (req.auth.tenantId !== tenantId && req.auth.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get tenant details
    const tenantResult = await pool.query(
      `SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, 
              created_at, updated_at
       FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];

    // Get statistics (only for non-super-admin viewing their own tenant or super_admin viewing any)
    const stats = {};

    if (req.auth.role === 'super_admin' || req.auth.tenantId === tenantId) {
      // Count total users in tenant
      const usersResult = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
        [tenantId]
      );
      stats.totalUsers = parseInt(usersResult.rows[0].count);

      // Count total projects in tenant
      const projectsResult = await pool.query(
        'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
        [tenantId]
      );
      stats.totalProjects = parseInt(projectsResult.rows[0].count);

      // Count total tasks in tenant
      const tasksResult = await pool.query(
        'SELECT COUNT(*) as count FROM tasks WHERE tenant_id = $1',
        [tenantId]
      );
      stats.totalTasks = parseInt(tasksResult.rows[0].count);
    }

    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        ...stats,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tenants/:tenantId/users
 * Add a new user to a tenant
 * Tenant admin and super_admin can add users
 * Respects tenant subscription limits (max_users)
 */
router.post('/:tenantId/users', isTenantAdmin, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { tenantId } = req.params;
    const { email, fullName, password, role } = req.body;

    // Validate tenant ID format
    if (!isValidUUID(tenantId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID format' });
    }

    // Verify authorization - user must be admin of this tenant
    if (req.auth.tenantId !== tenantId && req.auth.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate required fields
    if (!validateRequired('email', email)) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!validateRequired('fullName', fullName)) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!validateRequired('password', password)) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Validate role
    const userRole = role || 'user'; // Default to 'user' role
    if (!isValidEnum(userRole, Object.values(ROLES))) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed values: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Only tenant_admin and super_admin can assign other roles
    if (role && role !== 'user') {
      if (req.auth.role !== 'super_admin' && req.auth.role !== 'tenant_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can assign roles',
        });
      }
    }

    await client.query('BEGIN');

    try {
      // Get tenant to check limits
      const tenantResult = await client.query(
        'SELECT id, max_users FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      const tenant = tenantResult.rows[0];

      // Check user limit
      const userCountResult = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
        [tenantId]
      );

      const currentUserCount = parseInt(userCountResult.rows[0].count);
      if (currentUserCount >= tenant.max_users) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `User limit (${tenant.max_users}) reached for this tenant`,
        });
      }

      // Check email uniqueness within tenant
      const emailCheckResult = await client.query(
        'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
        [tenantId, email.toLowerCase()]
      );

      if (emailCheckResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'Email already exists in this tenant',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const userId = uuidv4();
      const result = await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         RETURNING id, tenant_id, email, full_name, role, is_active, created_at, updated_at`,
        [userId, tenantId, email.toLowerCase(), passwordHash, fullName, userRole]
      );

      await client.query('COMMIT');

      const user = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
});

/**
 * GET /api/tenants/:tenantId/users
 * List users in a tenant
 * Tenant admin can view users in their tenant, super_admin can view any
 */
router.get('/:tenantId/users', async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Validate tenant ID format
    if (!isValidUUID(tenantId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID format' });
    }

    // Verify authorization
    if (req.auth.tenantId !== tenantId && req.auth.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const roleFilter = req.query.role;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page >= 1, 1 <= limit <= 100',
      });
    }

    // Validate role filter if provided
    if (roleFilter && !isValidEnum(roleFilter, Object.values(ROLES))) {
      return res.status(400).json({
        success: false,
        message: `Invalid role filter. Allowed values: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Build query with filters
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams = [tenantId];

    if (search) {
      whereClause += ` AND (LOWER(email) LIKE LOWER($${queryParams.length + 1}) OR LOWER(full_name) LIKE LOWER($${queryParams.length + 1}))`;
      queryParams.push(`%${search}%`);
    }

    if (roleFilter) {
      whereClause += ` AND role = $${queryParams.length + 1}`;
      queryParams.push(roleFilter);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT id, tenant_id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    const users = dataResult.rows.map((u) => ({
      id: u.id,
      tenantId: u.tenant_id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenants/:tenantId

 * Update tenant details
 * Tenant admin can update name, super_admin can update all fields
 */
router.put('/:tenantId', isTenantAdmin, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Validate UUID format
    if (!isValidUUID(tenantId)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID format' });
    }

    // Check authorization: user can only update their own tenant or be super_admin
    if (req.auth.tenantId !== tenantId && req.auth.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Verify tenant exists
    const tenantResult = await pool.query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Prepare update fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Tenant admin can only update name
    if (req.auth.role !== 'super_admin') {
      // Tenant admin restrictions
      if (name !== undefined) {
        if (!validateRequired('name', name)) {
          return res.status(400).json({ success: false, message: 'Name is required' });
        }
        updateFields.push(`name = $${paramCount++}`);
        values.push(name);
      }
      // Tenant admin cannot update other fields
      if (status || subscriptionPlan || maxUsers || maxProjects) {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update status, plan, or limits',
        });
      }
    } else {
      // Super admin can update all fields
      if (name !== undefined) {
        if (!validateRequired('name', name)) {
          return res.status(400).json({ success: false, message: 'Name is required' });
        }
        updateFields.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (status !== undefined) {
        if (!isValidEnum(status, Object.values(TENANT_STATUS))) {
          return res.status(400).json({
            success: false,
            message: `Invalid status. Allowed values: ${Object.values(TENANT_STATUS).join(', ')}`,
          });
        }
        updateFields.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (subscriptionPlan !== undefined) {
        if (!isValidEnum(subscriptionPlan, Object.values(SUBSCRIPTION_PLANS))) {
          return res.status(400).json({
            success: false,
            message: `Invalid subscription plan. Allowed values: ${Object.values(SUBSCRIPTION_PLANS).join(', ')}`,
          });
        }
        updateFields.push(`subscription_plan = $${paramCount++}`);
        values.push(subscriptionPlan);
      }

      if (maxUsers !== undefined) {
        if (typeof maxUsers !== 'number' || maxUsers < 1) {
          return res.status(400).json({
            success: false,
            message: 'Max users must be a positive number',
          });
        }
        updateFields.push(`max_users = $${paramCount++}`);
        values.push(maxUsers);
      }

      if (maxProjects !== undefined) {
        if (typeof maxProjects !== 'number' || maxProjects < 1) {
          return res.status(400).json({
            success: false,
            message: 'Max projects must be a positive number',
          });
        }
        updateFields.push(`max_projects = $${paramCount++}`);
        values.push(maxProjects);
      }
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add tenant ID to values and updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(tenantId);

    const query = `
      UPDATE tenants 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, subdomain, status, subscription_plan, max_users, max_projects, 
                created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        subdomain: result.rows[0].subdomain,
        status: result.rows[0].status,
        subscriptionPlan: result.rows[0].subscription_plan,
        maxUsers: result.rows[0].max_users,
        maxProjects: result.rows[0].max_projects,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants
 * List all tenants (super admin only)
 * Supports pagination with page and limit query params
 */
router.get('/', isSuperAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // Optional filter
    const plan = req.query.plan; // Optional filter

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page >= 1, 1 <= limit <= 100',
      });
    }

    // Validate filter enums if provided
    if (status && !isValidEnum(status, Object.values(TENANT_STATUS))) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter. Allowed values: ${Object.values(TENANT_STATUS).join(', ')}`,
      });
    }

    if (plan && !isValidEnum(plan, Object.values(SUBSCRIPTION_PLANS))) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan filter. Allowed values: ${Object.values(SUBSCRIPTION_PLANS).join(', ')}`,
      });
    }

    // Build query with optional filters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (status) {
      whereClause += ' AND status = $' + (queryParams.length + 1);
      queryParams.push(status);
    }

    if (plan) {
      whereClause += ' AND subscription_plan = $' + (queryParams.length + 1);
      queryParams.push(plan);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tenants ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        t.id, t.name, t.subdomain, t.status, t.subscription_plan, t.max_users, t.max_projects,
        t.created_at, t.updated_at,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects,
        (SELECT COUNT(*) FROM tasks tk WHERE tk.tenant_id = t.id) AS total_tasks
      FROM tenants t
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    const tenants = dataResult.rows.map((t) => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      subscriptionPlan: t.subscription_plan,
      maxUsers: t.max_users,
      maxProjects: t.max_projects,
      totalUsers: parseInt(t.total_users || 0),
      totalProjects: parseInt(t.total_projects || 0),
      totalTasks: parseInt(t.total_tasks || 0),
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
