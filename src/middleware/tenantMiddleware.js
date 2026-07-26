const User = require('../models/User');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware to handle multi-tenancy (Tent House isolation)
 * Extracts tent_house_id from headers, params, or user context
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    let tentHouseId = null;
    let branchId = null;

    // Try to get from headers first
    if (req.headers['x-tent-house-id']) {
      tentHouseId = req.headers['x-tent-house-id'];
    }

    // Try from URL params
    if (req.params.tentHouseId) {
      tentHouseId = req.params.tentHouseId;
    }

    // Try from request body
    if (req.body.tentHouseId) {
      tentHouseId = req.body.tentHouseId;
    }

    // If user is authenticated and no tent house specified, get from user context
    if (userId && !tentHouseId) {
      const user = await User.findById(userId);
      if (user) {
        // Check if user has a default tent house association
        const db = require('../config/db');
        const result = await db.query(
          `SELECT tent_house_id, branch_id 
           FROM user_roles 
           WHERE user_id = $1 AND is_active = TRUE AND tent_house_id IS NOT NULL 
           ORDER BY is_primary DESC 
           LIMIT 1`,
          [userId]
        );

        if (result.rows.length > 0) {
          tentHouseId = result.rows[0].tent_house_id;
          branchId = result.rows[0].branch_id;
        }
      }
    }
    // Attach tenant info to request
    req.tenant = {
      tentHouseId,
      branchId,
      isPlatformAdmin: !tentHouseId, // No tent house = platform admin
    };

    logger.debug(`Tenant context: ${tentHouseId || 'Platform Level'}`);
    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    return errorResponse(res, 'Tenant context failed', 500);
  }
};

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access their own tent house data
 */
const enforceTenantIsolation = (options = {}) => {
  const { allowPlatformAdmins = true, requiredRole = null } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const requestedTentHouseId = req.tenant?.tentHouseId;

      // Platform admins can access all
      if (!requestedTentHouseId && allowPlatformAdmins) {
        const user = await User.findById(userId);
        if (user && ['super_admin', 'state_admin', 'district_admin', 'city_admin'].includes(user.role)) {
          return next();
        }
      }

      // Check if user has access to this tent house
      const UserRole = require('../models/UserRole');
      const hasAccess = await UserRole.hasRole(userId, null, requestedTentHouseId);

      if (!hasAccess && !allowPlatformAdmins) {
        return errorResponse(res, 'Access denied to this tent house', 403);
      }

      next();
    } catch (error) {
      logger.error('Tenant isolation error:', error);
      return errorResponse(res, 'Tenant isolation failed', 500);
    }
  };};

module.exports = { tenantMiddleware, enforceTenantIsolation };
