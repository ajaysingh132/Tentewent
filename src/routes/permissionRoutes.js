const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');

// All routes require authentication
router.use(authMiddleware);

// Public permission viewing (for authenticated users)
router.get('/', permissionController.getAllPermissions);
router.get('/groups', permissionController.getPermissionGroups);
router.get('/:id', permissionController.getPermissionById);
router.get('/name/:name', permissionController.getPermissionByName);
router.get('/module/:module', permissionController.getPermissionsByModule);

// Admin-only routes for permission management
router.post(
  '/',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.createPermission
);

router.put(
  '/:id',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.updatePermission
);

router.delete(
  '/:id',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.deletePermission
);

// Permission assignment to roles
router.post(
  '/:permissionId/assign-to-role/:roleId',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.assignPermissionToRole
);

router.delete(
  '/:permissionId/remove-from-role/:roleId',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.removePermissionFromRole
);

// Bulk operations
router.post(
  '/bulk-assign/:roleId',
  checkRole(['super_admin']),
  checkPermission('admin.manage_permissions'),
  permissionController.bulkAssignPermissions
);

// Get role permissions
router.get(
  '/roles/:roleId',
  checkRole(['super_admin', 'state_admin', 'tent_owner']),
  permissionController.getRolePermissions
);

module.exports = router;
