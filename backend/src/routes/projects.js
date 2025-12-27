const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { isValidUUID, validateRequired, isValidEnum } = require('../utils/validators');
const { PROJECT_STATUS, SUBSCRIPTION_PLANS, ROLES } = require('../utils/constants');

/**
 * POST /api/projects
 * Create a new project in the authenticated user's tenant
 * Checks project limit from subscription plan
 */
router.post('/', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!validateRequired('name', name)) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    // Only tenant admins can create projects (super admins and users are blocked)
    if (req.auth.role !== ROLES.TENANT_ADMIN || !req.auth.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admins can create projects',
      });
    }

    await client.query('BEGIN');

    try {
      // Get tenant to check limits
      const tenantResult = await client.query(
        'SELECT id, max_projects FROM tenants WHERE id = $1',
        [req.auth.tenantId]
      );

      if (tenantResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      const tenant = tenantResult.rows[0];

      // Check project limit
      const projectCountResult = await client.query(
        'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
        [req.auth.tenantId]
      );

      const currentProjectCount = parseInt(projectCountResult.rows[0].count);
      if (currentProjectCount >= tenant.max_projects) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Project limit (${tenant.max_projects}) reached for this tenant`,
        });
      }

      // Create project
      const projectId = uuidv4();
      const result = await client.query(
        `INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, tenant_id, name, description, status, created_by, created_at, updated_at`,
        [projectId, req.auth.tenantId, name, description || null, 'active', req.auth.userId]
      );

      await client.query('COMMIT');

      const project = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          id: project.id,
          tenantId: project.tenant_id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdBy: project.created_by,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
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
 * GET /api/projects
 * List projects for the authenticated user's tenant
 * Supports filtering by status and search by name
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search || '';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page >= 1, 1 <= limit <= 100',
      });
    }

    // Validate status filter if provided
    if (status && !isValidEnum(status, Object.values(PROJECT_STATUS))) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${Object.values(PROJECT_STATUS).join(', ')}`,
      });
    }

    // Build query with filters - filter by tenant unless super admin
    let whereClause = '';
    const queryParams = [];

    if (req.auth.role !== 'super_admin') {
      whereClause = 'WHERE p.tenant_id = $1';
      queryParams.push(req.auth.tenantId);
    }

    if (status) {
      whereClause = whereClause ? whereClause + ` AND p.status = $${queryParams.length + 1}` : `WHERE p.status = $1`;
      queryParams.push(status);
    }

    if (search) {
      const paramIndex = queryParams.length + 1;
      whereClause = whereClause ? whereClause + ` AND LOWER(p.name) LIKE LOWER($${paramIndex})` : `WHERE LOWER(p.name) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM projects p ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results with task counts
    const offset = (page - 1) * limit;
    const offsetParamIndex = queryParams.length + 1;
    const limitParamIndex = queryParams.length + 2;
    const dataQuery = `
      SELECT 
        p.id, p.tenant_id, p.name, p.description, p.status, p.created_by, p.created_at, p.updated_at,
        COUNT(t.id) as task_count,
        ten.name AS tenant_name,
        ten.subdomain AS tenant_subdomain
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN tenants ten ON ten.id = p.tenant_id
      ${whereClause}
      GROUP BY p.id, p.tenant_id, p.name, p.description, p.status, p.created_by, p.created_at, p.updated_at, ten.name, ten.subdomain
      ORDER BY p.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    // IMPORTANT: Parameter order must match indices used in the query
    // We used OFFSET $offsetParamIndex (queryParams.length + 1) and LIMIT $limitParamIndex (queryParams.length + 2)
    // So pass values in the order: [...queryParams, offset, limit]
    const dataResult = await pool.query(dataQuery, [...queryParams, offset, limit]);

    const projects = dataResult.rows.map((p) => ({
      id: p.id,
      tenantId: p.tenant_id,
      name: p.name,
      description: p.description,
      status: p.status,
      createdBy: p.created_by,
      taskCount: parseInt(p.task_count),
      tenantName: p.tenant_name,
      tenantSubdomain: p.tenant_subdomain,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json({
      success: true,
      data: projects,
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
 * PUT /api/projects/:projectId
 * Update a project
 * Only creator or tenant admin can update
 */
router.put('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    // Validate UUID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // Get project to check ownership and tenant
    const projectResult = await pool.query(
      'SELECT id, tenant_id, created_by FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check authorization - user is in correct tenant
    if (project.tenant_id !== req.auth.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check authorization - only creator or tenant_admin can update
    const isCreator = project.created_by === req.auth.userId;
    const isAdmin = req.auth.role === 'tenant_admin' || req.auth.role === 'super_admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prepare update fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      if (!validateRequired('name', name)) {
        return res.status(400).json({ success: false, message: 'Project name is required' });
      }
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (status !== undefined) {
      if (!isValidEnum(status, Object.values(PROJECT_STATUS))) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${Object.values(PROJECT_STATUS).join(', ')}`,
        });
      }
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add timestamp and project ID
    updateFields.push(`updated_at = NOW()`);
    values.push(projectId);

    const query = `
      UPDATE projects
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, tenant_id, name, description, status, created_by, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const updatedProject = result.rows[0];

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updatedProject.id,
        tenantId: updatedProject.tenant_id,
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status,
        createdBy: updatedProject.created_by,
        createdAt: updatedProject.created_at,
        updatedAt: updatedProject.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project and all its tasks
 * Only creator or tenant admin can delete
 */
router.delete('/:projectId', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { projectId } = req.params;

    // Validate UUID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // Get project to check ownership and tenant
    const projectResult = await client.query(
      'SELECT id, tenant_id, created_by FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check authorization - must be tenant admin within the same tenant
    if (project.tenant_id !== req.auth.tenantId || req.auth.role !== ROLES.TENANT_ADMIN) {
      return res.status(403).json({ success: false, message: 'Only tenant admins can delete projects' });
    }

    await client.query('BEGIN');

    try {
      // Delete all tasks in the project (cascade delete handled by ON DELETE CASCADE in schema)
      // But we'll do it explicitly for clarity
      await client.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

      // Delete the project
      await client.query('DELETE FROM projects WHERE id = $1', [projectId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Project deleted successfully',
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

module.exports = router;
