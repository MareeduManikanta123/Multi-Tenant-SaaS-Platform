const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateToken, getTokenExpiry } = require('../utils/jwt');
const { hashPassword, verifyPassword } = require('../utils/password');
const { isValidEmail, isValidSubdomain, isValidPassword, validateRequired } = require('../utils/validators');
const { ROLES, SUBSCRIPTION_PLANS, PLAN_LIMITS } = require('../utils/constants');

// POST /api/auth/register-tenant
router.post('/register-tenant', async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    // Validate required fields
    const missing = validateRequired({ tenantName, subdomain, adminEmail, adminPassword, adminFullName }, ['tenantName', 'subdomain', 'adminEmail', 'adminPassword', 'adminFullName']);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Validate email
    if (!isValidEmail(adminEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate subdomain
    if (!isValidSubdomain(subdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subdomain format (alphanumeric, 3-63 characters)',
      });
    }

    // Validate password
    if (!isValidPassword(adminPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    await client.query('BEGIN');

    // Check if subdomain already exists
    const subdomainCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain.toLowerCase()]);
    if (subdomainCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists',
      });
    }

    // Check if email already exists in any tenant (allow same email in different tenants)
    // Actually, for global uniqueness on first registration, we check differently
    // But per spec, email is unique per tenant, so we don't check globally

    // Create tenant
    const tenantId = uuidv4();
    const limits = PLAN_LIMITS['free'];
    
    await client.query(
      `INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, tenantName, subdomain.toLowerCase(), 'active', 'free', limits.max_users, limits.max_projects]
    );

    // Hash password
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    const adminId = uuidv4();
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, tenantId, adminEmail, passwordHash, adminFullName, ROLES.TENANT_ADMIN, true]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId,
        subdomain: subdomain.toLowerCase(),
        adminUser: {
          id: adminId,
          email: adminEmail,
          fullName: adminFullName,
          role: ROLES.TENANT_ADMIN,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register tenant error:', error);
    next(error);
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, tenantSubdomain, tenantId } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and password',
      });
    }

    // If tenant identifier is provided, perform tenant-scoped login
    if (tenantSubdomain || tenantId) {
      // Find tenant
      let tenant;
      if (tenantSubdomain) {
        const result = await pool.query(
          'SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects FROM tenants WHERE subdomain = $1',
          [tenantSubdomain.toLowerCase()]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Tenant not found',
          });
        }
        tenant = result.rows[0];
      } else {
        const result = await pool.query(
          'SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1',
          [tenantId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Tenant not found',
          });
        }
        tenant = result.rows[0];
      }

      // Check tenant status
      if (tenant.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'This tenant is not active',
        });
      }

      // Find user within tenant
      const userResult = await pool.query(
        'SELECT id, email, password_hash, full_name, role, is_active, tenant_id FROM users WHERE tenant_id = $1 AND email = $2',
        [tenant.id, email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive',
        });
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate token
      const token = generateToken(user.id, user.tenant_id, user.role);
      const expiresIn = getTokenExpiry();

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: user.tenant_id,
            tenant: {
              id: tenant.id,
              name: tenant.name,
              subdomain: tenant.subdomain,
              status: tenant.status,
              subscriptionPlan: tenant.subscription_plan,
              maxUsers: tenant.max_users,
              maxProjects: tenant.max_projects,
            },
          },
          token,
          expiresIn,
        },
      });
    }

    // No tenant provided: attempt super admin login
    const superAdminResult = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active, tenant_id FROM users WHERE email = $1 AND role = $2 AND tenant_id IS NULL LIMIT 1',
      [email, ROLES.SUPER_ADMIN]
    );

    if (superAdminResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const superAdmin = superAdminResult.rows[0];

    if (!superAdmin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const passwordOk = await verifyPassword(password, superAdmin.password_hash);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(superAdmin.id, null, superAdmin.role);
    const expiresIn = getTokenExpiry();

    return res.json({
      success: true,
      data: {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          fullName: superAdmin.full_name,
          role: superAdmin.role,
          tenantId: null,
        },
        token,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', (req, res, next) => {
  // This route requires auth middleware
  // If we got here, auth middleware already verified the token
  // Now fetch the user details from database
  
  (async () => {
    try {
      const userId = req.auth.userId;
      const tenantId = req.auth.tenantId;

      // Get user
      const userResult = await pool.query(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = userResult.rows[0];

      // Get tenant (if user has one)
      let tenant = null;
      if (tenantId) {
        const tenantResult = await pool.query(
          'SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1',
          [tenantId]
        );
        if (tenantResult.rows.length > 0) {
          tenant = tenantResult.rows[0];
        }
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          tenant: tenant ? {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            subscriptionPlan: tenant.subscription_plan,
            maxUsers: tenant.max_users,
            maxProjects: tenant.max_projects,
          } : null,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      next(error);
    }
  })();
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT-only approach: just return success
  // Client will remove token from localStorage
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
