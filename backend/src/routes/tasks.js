const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { isValidUUID, validateRequired, isValidEnum } = require('../utils/validators');
const { TASK_STATUS, TASK_PRIORITY, ROLES } = require('../utils/constants');

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task in a project
 * Validates that assignedTo user belongs to the same tenant
 */
router.post('/:projectId/tasks', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { projectId } = req.params;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // Validate required fields
    if (!validateRequired('title', title)) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    await client.query('BEGIN');

    try {
      // Get project and verify it belongs to user's tenant
      const projectResult = await client.query(
        'SELECT id, tenant_id FROM projects WHERE id = $1',
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const project = projectResult.rows[0];

      // Verify user is in the correct tenant
      if (project.tenant_id !== req.auth.tenantId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Validate assignedTo if provided
      if (assignedTo) {
        if (!isValidUUID(assignedTo)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        // Verify assignedTo user exists in the same tenant
        const userResult = await client.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
          [assignedTo, req.auth.tenantId]
        );

        if (userResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Assigned user not found in this tenant',
          });
        }
      }

      // Validate priority if provided
      const taskPriority = priority || 'medium';
      if (!isValidEnum(taskPriority, Object.values(TASK_PRIORITY))) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Allowed values: ${Object.values(TASK_PRIORITY).join(', ')}`,
        });
      }

      // Create task
      const taskId = uuidv4();
      const result = await client.query(
        `INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at`,
        [
          taskId,
          projectId,
          req.auth.tenantId,
          title,
          description || null,
          'todo',
          taskPriority,
          assignedTo || null,
          dueDate || null,
        ]
      );

      await client.query('COMMIT');

      const task = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          id: task.id,
          projectId: task.project_id,
          tenantId: task.tenant_id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_to,
          dueDate: task.due_date,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
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
 * GET /api/projects/:projectId/tasks
 * List tasks for a project with filtering and sorting
 * Supports filters: status, priority, assignedTo
 * Sorts by priority DESC, then dueDate ASC
 */
router.get('/:projectId/tasks', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status;
    const priorityFilter = req.query.priority;
    const assignedToFilter = req.query.assignedTo;
    const search = req.query.search || '';

    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    // Verify project exists and belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT id, tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Allow super admins to view tasks across tenants; enforce tenant match otherwise
    if (req.auth.role !== 'super_admin' && projectResult.rows[0].tenant_id !== req.auth.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page >= 1, 1 <= limit <= 100',
      });
    }

    // Validate filter enums if provided
    if (statusFilter && !isValidEnum(statusFilter, Object.values(TASK_STATUS))) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter. Allowed values: ${Object.values(TASK_STATUS).join(', ')}`,
      });
    }

    if (priorityFilter && !isValidEnum(priorityFilter, Object.values(TASK_PRIORITY))) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority filter. Allowed values: ${Object.values(TASK_PRIORITY).join(', ')}`,
      });
    }

    if (assignedToFilter && !isValidUUID(assignedToFilter)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format for assignedTo filter',
      });
    }

    // Build query with filters
    let whereClause = 'WHERE project_id = $1';
    const queryParams = [projectId];

    if (statusFilter) {
      whereClause += ` AND status = $${queryParams.length + 1}`;
      queryParams.push(statusFilter);
    }

    if (priorityFilter) {
      whereClause += ` AND priority = $${queryParams.length + 1}`;
      queryParams.push(priorityFilter);
    }

    if (assignedToFilter) {
      whereClause += ` AND assigned_to = $${queryParams.length + 1}`;
      queryParams.push(assignedToFilter);
    }

    if (search) {
      whereClause += ` AND LOWER(title) LIKE LOWER($${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tasks ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results - order by priority DESC, then due_date ASC
    const offset = (page - 1) * limit;
    const priorityOrder = {
      high: 1,
      medium: 2,
      low: 3,
    };

    const dataQuery = `
      SELECT id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
      FROM tasks
      ${whereClause}
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END ASC,
        COALESCE(due_date, '9999-12-31') ASC,
        created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    const tasks = dataResult.rows.map((t) => ({
      id: t.id,
      projectId: t.project_id,
      tenantId: t.tenant_id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assigned_to,
      dueDate: t.due_date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    res.json({
      success: true,
      data: tasks,
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
 * PATCH /api/tasks/:taskId/status
 * Update only the status of a task
 * Quick endpoint for changing task status
 */
router.patch('/:taskId/status', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Validate task ID format
    if (!isValidUUID(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    // Validate status is provided
    if (!validateRequired('status', status)) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Validate status enum
    if (!isValidEnum(status, Object.values(TASK_STATUS))) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${Object.values(TASK_STATUS).join(', ')}`,
      });
    }

    // Get task to verify tenant access
    const taskResult = await pool.query(
      'SELECT id, tenant_id, assigned_to FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const taskCheck = taskResult.rows[0];
    const isSuperAdmin = req.auth.role === ROLES.SUPER_ADMIN;
    const isTenantAdmin = req.auth.role === ROLES.TENANT_ADMIN;
    const isAssignedUser = taskCheck.assigned_to === req.auth.userId;

    if (!isSuperAdmin && taskCheck.tenant_id !== req.auth.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isSuperAdmin && !isTenantAdmin && !isAssignedUser) {
      return res.status(403).json({ success: false, message: 'Only the assignee or a tenant admin can update this task' });
    }

    // Update status
    const result = await pool.query(
      `UPDATE tasks
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at`,
      [status, taskId]
    );

    const task = result.rows[0];

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        id: task.id,
        projectId: task.project_id,
        tenantId: task.tenant_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update all fields of a task
 */
router.put('/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    // Validate task ID format
    if (!isValidUUID(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    // Get task to verify tenant access
    const taskResult = await pool.query(
      'SELECT id, tenant_id, assigned_to FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const isSuperAdmin = req.auth.role === ROLES.SUPER_ADMIN;
    const isTenantAdmin = req.auth.role === ROLES.TENANT_ADMIN;
    const isAssignedUser = task.assigned_to === req.auth.userId;

    if (!isSuperAdmin && task.tenant_id !== req.auth.tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!isSuperAdmin && !isTenantAdmin && !isAssignedUser) {
      return res.status(403).json({ success: false, message: 'Only the assignee or a tenant admin can update this task' });
    }

    // Prepare update fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (!validateRequired('title', title)) {
        return res.status(400).json({ success: false, message: 'Task title is required' });
      }
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (status !== undefined) {
      if (!isValidEnum(status, Object.values(TASK_STATUS))) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${Object.values(TASK_STATUS).join(', ')}`,
        });
      }
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (priority !== undefined) {
      if (!isValidEnum(priority, Object.values(TASK_PRIORITY))) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Allowed values: ${Object.values(TASK_PRIORITY).join(', ')}`,
        });
      }
      updateFields.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (assignedTo !== undefined) {
      // Allow null assignedTo to unassign
      if (assignedTo !== null) {
        if (!isValidUUID(assignedTo)) {
          return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        // Verify assignedTo user exists in the same tenant
        const userResult = await pool.query(
          'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
          [assignedTo, req.auth.tenantId]
        );

        if (userResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user not found in this tenant',
          });
        }
      }
      updateFields.push(`assigned_to = $${paramCount++}`);
      values.push(assignedTo);
    }

    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add timestamp and task ID
    updateFields.push(`updated_at = NOW()`);
    values.push(taskId);

    const query = `
      UPDATE tasks
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const updatedTask = result.rows[0];

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: updatedTask.id,
        projectId: updatedTask.project_id,
        tenantId: updatedTask.tenant_id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignedTo: updatedTask.assigned_to,
        dueDate: updatedTask.due_date,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Delete a task
 * Only tenant admins can delete tasks
 */
router.delete('/:taskId', async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Validate task ID format
    if (!isValidUUID(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    // Get task to verify tenant access
    const taskResult = await pool.query(
      'SELECT id, tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check authorization - must be tenant admin within the same tenant
    if (task.tenant_id !== req.auth.tenantId || req.auth.role !== ROLES.TENANT_ADMIN) {
      return res.status(403).json({ success: false, message: 'Only tenant admins can delete tasks' });
    }

    // Delete the task
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
