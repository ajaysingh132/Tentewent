const roleService = require('../services/roleService');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const roleController = {
  // GET /api/v1/roles - Get all roles
  getAllRoles: async (req, res) => {
    try {
      const { includePermissions } = req.query;
      const roles = await roleService.getAllRoles();

      if (includePermissions === 'true') {
        // Fetch roles with permissions
        const rolesWithPerms = await Promise.all(
          roles.map(async (role) => {
            const roleDetail = await roleService.getRoleById(role.id);
            return roleDetail;
          })
        );
        return successResponse(res, 'Roles fetched successfully', rolesWithPerms);
      }

      return successResponse(res, 'Roles fetched successfully', roles);
    } catch (error) {
      logger.error('Get all roles error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/roles/:id - Get role by ID
  getRoleById: async (req, res) => {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      return successResponse(res, 'Role fetched successfully', role);
    } catch (error) {
      logger.error('Get role by ID error:', error);
      return errorResponse(res, error.message, 404);
    }
  },

  // GET /api/v1/roles/name/:name - Get role by name
  getRoleByName: async (req, res) => {
    try {
      const { name } = req.params;
      const role = await roleService.getRoleByName(name);
      return successResponse(res, 'Role fetched successfully', role);
    } catch (error) {
      logger.error('Get role by name error:', error);
      return errorResponse(res, error.message, 404);    }
  },

  // POST /api/v1/roles - Create new role
  createRole: async (req, res) => {
    try {
      const roleData = req.body;
      
      // Validate required fields
      if (!roleData.role_name || !roleData.display_name || !roleData.role_level) {
        return errorResponse(res, 'role_name, display_name, and role_level are required', 400);
      }

      const newRole = await roleService.createRole(roleData);
      logger.info(`New role created: ${newRole.role_name}`);
      return successResponse(res, 'Role created successfully', newRole, 201);
    } catch (error) {
      logger.error('Create role error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // PUT /api/v1/roles/:id - Update role
  updateRole: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent modifying system fields
      delete updates.is_system_role;
      delete updates.role_name; // Cannot change role name

      const updatedRole = await roleService.updateRole(id, updates);
      logger.info(`Role updated: ${id}`);
      return successResponse(res, 'Role updated successfully', updatedRole);
    } catch (error) {
      logger.error('Update role error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // DELETE /api/v1/roles/:id - Delete role
  deleteRole: async (req, res) => {
    try {
      const { id } = req.params;
      await roleService.deleteRole(id);
      logger.info(`Role deleted: ${id}`);
      return successResponse(res, 'Role deleted successfully');
    } catch (error) {
      logger.error('Delete role error:', error);      return errorResponse(res, error.message, 400);
    }
  },

  // POST /api/v1/roles/:roleId/assign-to-user - Assign role to user
  assignRoleToUser: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { userId, tentHouseId, branchId } = req.body;
      const assignedBy = req.user.userId;

      if (!userId) {
        return errorResponse(res, 'userId is required', 400);
      }

      const userRole = await roleService.assignRoleToUser(
        userId,
        roleId,
        tentHouseId,
        branchId,
        assignedBy
      );

      logger.info(`Role ${roleId} assigned to user ${userId}`);
      return successResponse(res, 'Role assigned successfully', userRole);
    } catch (error) {
      logger.error('Assign role error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // DELETE /api/v1/roles/:roleId/remove-from-user/:userId - Remove role from user
  removeRoleFromUser: async (req, res) => {
    try {
      const { roleId, userId } = req.params;
      const { tentHouseId } = req.query;

      await roleService.removeRoleFromUser(userId, roleId, tentHouseId);
      logger.info(`Role ${roleId} removed from user ${userId}`);
      return successResponse(res, 'Role removed successfully');
    } catch (error) {
      logger.error('Remove role error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // GET /api/v1/roles/users/:userId - Get user's roles
  getUserRoles: async (req, res) => {
    try {
      const { userId } = req.params;      const { tentHouseId } = req.query;

      const roles = await roleService.getUserRoles(userId, tentHouseId);
      return successResponse(res, 'User roles fetched successfully', roles);
    } catch (error) {
      logger.error('Get user roles error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/roles/users/:userId/permissions - Get user's permissions
  getUserPermissions: async (req, res) => {
    try {
      const { userId } = req.params;
      const { tentHouseId } = req.query;

      const permissions = await roleService.getUserPermissions(userId, tentHouseId);
      return successResponse(res, 'User permissions fetched successfully', permissions);
    } catch (error) {
      logger.error('Get user permissions error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/roles/users/:userId/set-primary - Set user's primary role
  setUserPrimaryRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId, tentHouseId } = req.body;

      await roleService.setUserPrimaryRole(userId, roleId, tentHouseId);
      logger.info(`Primary role set for user ${userId}`);
      return successResponse(res, 'Primary role set successfully');
    } catch (error) {
      logger.error('Set primary role error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // GET /api/v1/roles/:roleId/users - Get all users with specific role
  getUsersByRole: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { tentHouseId } = req.query;

      const users = await roleService.getUsersByRole(roleId, tentHouseId);
      return successResponse(res, 'Users fetched successfully', users);
    } catch (error) {
      logger.error('Get users by role error:', error);
      return errorResponse(res, error.message, 500);    }
  },

  // GET /api/v1/roles/:roleId/children - Get child roles
  getChildRoles: async (req, res) => {
    try {
      const { roleId } = req.params;
      const children = await roleService.getChildRoles(roleId);
      return successResponse(res, 'Child roles fetched successfully', children);
    } catch (error) {
      logger.error('Get child roles error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/roles/:roleId/parents - Get parent roles
  getParentRoles: async (req, res) => {
    try {
      const { roleId } = req.params;
      const parents = await roleService.getParentRoles(roleId);
      return successResponse(res, 'Parent roles fetched successfully', parents);
    } catch (error) {
      logger.error('Get parent roles error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
};

module.exports = roleController;
