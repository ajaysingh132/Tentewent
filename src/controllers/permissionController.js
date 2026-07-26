const permissंionService = require('../services/permissionService');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const permissionController = {
  // GET /api/v1/permissions - Get all permissions
  getAllPermissions: async (req, res) => {
    try {
      const { groupBy } = req.query;
      
      let permissions;
      if (groupBy === 'module') {
        permissions = await permissionService.getPermissionsGroupedByModule();
      } else if (groupBy === 'group') {
        const groups = await permissionService.getPermissionGroups();
        const allPerms = await permissionService.getAllPermissions();
        
        permissions = groups.map((group) => ({
          ...group,
          permissions: allPerms.filter((p) => p.group_id === group.id),
        }));
      } else {
        permissions = await permissionService.getAllPermissions();
      }

      return successResponse(res, 'Permissions fetched successfully', permissions);
    } catch (error) {
      logger.error('Get all permissions error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/permissions/:id - Get permission by ID
  getPermissionById: async (req, res) => {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);
      return successResponse(res, 'Permission fetched successfully', permission);
    } catch (error) {
      logger.error('Get permission by ID error:', error);
      return errorResponse(res, error.message, 404);
    }
  },

  // GET /api/v1/permissions/name/:name - Get permission by name
  getPermissionByName: async (req, res) => {
    try {
      const { name } = req.params;
      const permission = await permissionService.getPermissionByName(name);
      return successResponse(res, 'Permission fetched successfully', permission);    } catch (error) {
      logger.error('Get permission by name error:', error);
      return errorResponse(res, error.message, 404);
    }
  },

  // GET /api/v1/permissions/module/:module - Get permissions by module
  getPermissionsByModule: async (req, res) => {
    try {
      const { module } = req.params;
      const permissions = await permissionService.getPermissionsByModule(module);
      return successResponse(res, 'Permissions fetched successfully', permissions);
    } catch (error) {
      logger.error('Get permissions by module error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/permissions - Create new permission
  createPermission: async (req, res) => {
    try {
      const permissionData = req.body;

      // Validate required fields
      if (
        !permissionData.permission_name ||
        !permissionData.display_name ||
        !permissionData.module ||
        !permissionData.action
      ) {
        return errorResponse(
          res,
          'permission_name, display_name, module, and action are required',
          400
        );
      }

      const newPermission = await permissionService.createPermission(permissionData);
      logger.info(`New permission created: ${newPermission.permission_name}`);
      return successResponse(res, 'Permission created successfully', newPermission, 201);
    } catch (error) {
      logger.error('Create permission error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // PUT /api/v1/permissions/:id - Update permission
  updatePermission: async (req, res) => {
    try {
      const { id } = req.params;      const updates = req.body;

      // Prevent modifying permission_name
      delete updates.permission_name;

      const updatedPermission = await permissionService.updatePermission(id, updates);
      logger.info(`Permission updated: ${id}`);
      return successResponse(res, 'Permission updated successfully', updatedPermission);
    } catch (error) {
      logger.error('Update permission error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // DELETE /api/v1/permissions/:id - Delete permission
  deletePermission: async (req, res) => {
    try {
      const { id } = req.params;
      await permissionService.deletePermission(id);
      logger.info(`Permission deleted: ${id}`);
      return successResponse(res, 'Permission deleted successfully');
    } catch (error) {
      logger.error('Delete permission error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // POST /api/v1/permissions/:permissionId/assign-to-role/:roleId - Assign permission to role
  assignPermissionToRole: async (req, res) => {
    try {
      const { permissionId, roleId } = req.params;
      const { isAllowed = true } = req.body;

      const result = await permissionService.assignPermissionToRole(
        roleId,
        permissionId,
        isAllowed
      );

      logger.info(`Permission ${permissionId} assigned to role ${roleId}`);
      return successResponse(res, 'Permission assigned successfully', result);
    } catch (error) {
      logger.error('Assign permission error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // DELETE /api/v1/permissions/:permissionId/remove-from-role/:roleId - Remove permission from role
  removePermissionFromRole: async (req, res) => {
    try {      const { permissionId, roleId } = req.params;

      await permissionService.removePermissionFromRole(roleId, permissionId);
      logger.info(`Permission ${permissionId} removed from role ${roleId}`);
      return successResponse(res, 'Permission removed successfully');
    } catch (error) {
      logger.error('Remove permission error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // POST /api/v1/permissions/bulk-assign/:roleId - Bulk assign permissions to role
  bulkAssignPermissions: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissionIds, isAllowed = true } = req.body;

      if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
        return errorResponse(res, 'permissionIds array is required', 400);
      }

      const results = await permissionService.bulkAssignPermissions(
        roleId,
        permissionIds,
        isAllowed
      );

      logger.info(`${permissionIds.length} permissions bulk assigned to role ${roleId}`);
      return successResponse(res, 'Permissions bulk assigned successfully', results);
    } catch (error) {
      logger.error('Bulk assign permissions error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  // GET /api/v1/permissions/groups - Get permission groups
  getPermissionGroups: async (req, res) => {
    try {
      const groups = await permissionService.getPermissionGroups();
      return successResponse(res, 'Permission groups fetched successfully', groups);
    } catch (error) {
      logger.error('Get permission groups error:', error);
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/permissions/roles/:roleId - Get all permissions for a role
  getRolePermissions: async (req, res) => {
    try {
      const { roleId } = req.params;      const roleService = require('../services/roleService');
      const role = await roleService.getRoleById(roleId);
      
      return successResponse(
        res,
        'Role permissions fetched successfully',
        role.permissions || []
      );
    } catch (error) {
      logger.error('Get role permissions error:', error);
      return errorResponse(res, error.message, 500);
    }
  },
};

module.exports = permissionController;
