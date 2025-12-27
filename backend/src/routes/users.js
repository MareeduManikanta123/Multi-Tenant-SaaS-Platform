const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { isTenantAdmin } = require('../middleware/authorize');
const { isValidEmail, isValidPassword, isValidUUID, validateRequired, isValidEnum } = require('../utils/validators');
const { ROLES } = require('../utils/constants');

/**
 * PUT /api/users/:userId
 * Update user details
 * Users can update their own fullName, tenant_admin can update role/isActive for other users
 */
router.put('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Get user being updated
    const userResult = await pool.query(
      'SELECT id, tenant_id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userResult.rows[0];

    // Authorization checks
    // User can update their own fullName
    // Tenant admin can update role/isActive for users in their tenant
    const isOwnUser = req.auth.userId === userId;
    const isAdminOfTenant = req.auth.tenantId === targetUser.tenant_id && 
                            ['tenant_admin', 'super_admin'].includes(req.auth.role);

    if (!isOwnUser && !isAdminOfTenant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prepare update fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Users can update their own fullName
    if (fullName !== undefined) {
      if (!validateRequired('fullName', fullName)) {
        return res.status(400).json({ success: false, message: 'Full name is required' });
      }
      updateFields.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }

    // Only admin can update role/isActive
    if (!isAdminOfTenant && (role !== undefined || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Only tenant admin can update role or active status',
      });
    }

    // Admin can update role
    if (role !== undefined) {
      if (!isValidEnum(role, Object.values(ROLES))) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed values: ${Object.values(ROLES).join(', ')}`,
        });
      }
      // Prevent admin from changing own role
      if (isOwnUser && req.auth.role !== role) {
        return res.status(403).json({
          success: false,
          message: 'Cannot change your own role',
        });
      }
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }

    // Admin can update isActive
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
      }
      // Prevent admin from deactivating own account
      if (isOwnUser && !isActive) {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add timestamp and user ID
    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, tenant_id, email, full_name, role, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    res.json({
      success: true,
      message: 'User updated successfully',
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
    next(error);
  }
});

/**
 * DELETE /api/users/:userId
 * Delete a user
 * Tenant admin can delete users in their tenant, super_admin can delete any user
 * Prevents self-deletion, updates tasks assigned to deleted user to have null assignee
 */
router.delete('/:userId', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Prevent self-deletion
    if (req.auth.userId === userId) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Get user being deleted
    const userResult = await client.query(
      'SELECT id, tenant_id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userResult.rows[0];

    // Authorization checks
    const isAdminOfTenant = req.auth.tenantId === targetUser.tenant_id &&
                            ['tenant_admin', 'super_admin'].includes(req.auth.role);

    if (!isAdminOfTenant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Use transaction to ensure consistency
    await client.query('BEGIN');

    try {
      // Step 1: Set all tasks assigned to this user to have null assignee
      await client.query(
        'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
        [userId]
      );

      // Step 2: Delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Step 3: Commit transaction
      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'User deleted successfully',
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
