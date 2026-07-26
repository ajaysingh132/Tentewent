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
