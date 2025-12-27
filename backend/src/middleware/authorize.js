const { ROLES } = require('../utils/constants');

// Authorization middleware - checks if user has required role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.auth.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

// Check if user is super admin
function isSuperAdmin(req, res, next) {
  if (req.auth.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }
  next();
}

// Check if user is tenant admin
function isTenantAdmin(req, res, next) {
  if (!['super_admin', 'tenant_admin'].includes(req.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }
  next();
}

module.exports = {
  requireRole,
  isSuperAdmin,
  isTenantAdmin,
};
