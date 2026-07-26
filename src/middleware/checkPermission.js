const UserRole = require('../models/UserRole');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has specific permission(s)
 * @param {string|string[]} requiredPermissions - Permission name(s) required
 * @param {boolean} requireAll - If true, user must have ALL permissions
 */
const checkPermission = (requiredPermissions, requireAll = false) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const tentHouseId = req.tenant?.tentHouseId;

      // Normalize to array
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Check each permission
      const permissionChecks = await Promise.all(
        permissions.map((permName) =>
          UserRole.hasPermission(userId, permName, tentHouseId)
        )
      );

      const hasAccess = requireAll
        ? permissionChecks.every((check) => check)
        : permissionChecks.some((check) => check);

      if (!hasAccess) {
        logger.warn(
          `User ${userId} denied permission. Required: ${permissions.join(', ')}`
        );
        return errorResponse(
          res,
          'Access denied: Insufficient permissions',
          403
        );
      }

      // Attach permissions to request
      req.userPermissions = permissions;
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return errorResponse(res, 'Permission verification failed', 500);
    }
  };
};

/**
 * Dynamic permission check based on request data
 */
const checkPermissionDynamic = (permissionTemplate) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const tentHouseId = req.tenant?.tentHouseId;

      // Replace placeholders in permission name
      // Example: "booking.edit_own" or "inventory.view_{module}"
      let permissionName = permissionTemplate;
      
      // Replace common placeholders
      if (req.params.id) {
        permissionName = permissionName.replace(':id', req.params.id);
      }
      if (req.body.module) {
        permissionName = permissionName.replace('{module}', req.body.module);
      }

      const hasPermission = await UserRole.hasPermission(
        userId,
        permissionName,
        tentHouseId
      );

      if (!hasPermission) {
        logger.warn(`User ${userId} denied dynamic permission: ${permissionName}`);
        return errorResponse(res, 'Access denied: Permission required', 403);
      }

      next();
    } catch (error) {
      logger.error('Dynamic permission check error:', error);
      return errorResponse(res, 'Permission verification failed', 500);
    }
  };
};

module.exports = { checkPermission, checkPermissionDynamic };
