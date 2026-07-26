const db = require('../config/db');

const Permission = {
  // Get all permissions
  getAll: async () => {
    const result = await db.query(
      `SELECT p.*, pg.display_name as group_name
       FROM permissions p
       LEFT JOIN permission_groups pg ON p.group_id = pg.id
       ORDER BY pg.sort_order, p.module, p.action`
    );
    return result.rows;
  },

  // Get permission by ID
  findById: async (id) => {
    const result = await db.query('SELECT * FROM permissions WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Get permission by name
  findByName: async (permissionName) => {
    const result = await db.query('SELECT * FROM permissions WHERE permission_name = $1', [permissionName]);
    return result.rows[0];
  },

  // Get permissions by module
  findByModule: async (module) => {
    const result = await db.query(
      'SELECT * FROM permissions WHERE module = $1 ORDER BY action',
      [module]
    );
    return result.rows;
  },

  // Get permissions by group
  findByGroup: async (groupId) => {
    const result = await db.query(
      'SELECT * FROM permissions WHERE group_id = $1 ORDER BY module, action',
      [groupId]
    );
    return result.rows;
  },

  // Create permission
  create: async (permissionData) => {
    const { permission_name, display_name, module, action, description, group_id } = permissionData;
    const query = `
      INSERT INTO permissions (permission_name, display_name, module, action, description, group_id)
      VALUES ($1, $2, $3, $4, $5, $6)      RETURNING *
    `;
    const result = await db.query(query, [permission_name, display_name, module, action, description, group_id]);
    return result.rows[0];
  },

  // Update permission
  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const query = `UPDATE permissions SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  },

  // Delete permission
  delete: async (id) => {
    await db.query('DELETE FROM permissions WHERE id = $1', [id]);
    return true;
  },

  // Assign permission to role
  assignToRole: async (roleId, permissionId, isAllowed = true) => {
    const query = `
      INSERT INTO role_permissions (role_id, permission_id, is_allowed)
      VALUES ($1, $2, $3)
      ON CONFLICT (role_id, permission_id) DO UPDATE SET is_allowed = $3
      RETURNING *
    `;
    const result = await db.query(query, [roleId, permissionId, isAllowed]);
    return result.rows[0];
  },

  // Remove permission from role
  removeFromRole: async (roleId, permissionId) => {
    await db.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    return true;
  },

  // Get all permission groups
  getGroups: async () => {
    const result = await db.query(
      'SELECT * FROM permission_groups ORDER BY sort_order'
    );
    return result.rows;
  },};

module.exports = Permission;
