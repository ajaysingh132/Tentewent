const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return errorResponse(res, 'User not found', 404);
      if (!user.is_active) return errorResponse(res, 'Account deactivated', 403);

      if (!allowedRoles.includes(user.role)) {
        return errorResponse(res, 'Access denied: insufficient permissions', 403);
      }

      req.currentUser = user;
      next();
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  };
};

module.exports = roleMiddleware;
const UserRole = require('../models/UserRole');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has specific role(s)
 * @param {string|string[]} allowedRoles - Role name(s) allowed to access
 * @param {boolean} requireAll - If true, user must have ALL roles
 */
const checkRole = (allowedRoles, requireAll = false) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const tentHouseId = req.tenant?.tentHouseId; // From tenant middleware

      // Normalize to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check each role
      const roleChecks = await Promise.all(
        roles.map((roleName) => UserRole.hasRole(userId, roleName, tentHouseId))
      );

      const hasAccess = requireAll
        ? roleChecks.every((check) => check)
        : roleChecks.some((check) => check);

      if (!hasAccess) {
        logger.warn(`User ${userId} denied access. Required roles: ${roles.join(', ')}`);
        return errorResponse(res, 'Access denied: Insufficient role permissions', 403);
      }

      // Attach roles to request
      req.userRoles = roles;
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return errorResponse(res, 'Role verification failed', 500);
    }
  };
};

module.exports = checkRole;
