ीconst UserRole = require('../models/UserRole');
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
