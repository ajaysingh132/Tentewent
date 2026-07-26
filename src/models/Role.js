const db = require('../config/db');

const Role = {
  // Get all roles
  getAll: async () => {
    const result = await db.query(
      'SELECT * FROM roles WHERE is_active = TRUE ORDER BY role_level, id'
    );
    return result.rows;
  },

  // Get role by ID
  findById: async (id) => {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Get role by name
  findByName: async (roleName) => {
    const result = await db.query('SELECT * FROM roles WHERE role_name = $1', [roleName]);
    return result.rows[0];
  },

  // Get role with permissions
  findByIdWithPermissions: async (id) => {
    const result = await db.query(
      `SELECT
        r.*,
        json_agg(
          json_build_object(
            'id', p.id,
            'permission_name', p.permission_name,
            'display_name', p.display_name,
            'module', p.module,
            'action', p.action
          )
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_allowed = TRUE
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = $1
      GROUP BY r.id`,
      [id]
    );
    return result.rows[0];
  },

  // Create role
  create: async (roleData) => {
    const { role_name, display_name, description, role_level, is_system_role } = roleData;    const query = `
      INSERT INTO roles (role_name, display_name, description, role_level, is_system_role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [role_name, display_name, description, role_level, is_system_role || false]);
    return result.rows[0];
  },

  // Update role
  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const query = `UPDATE roles SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  },

  // Delete role (soft delete)
  delete: async (id) => {
    const result = await db.query(
      'UPDATE roles SET is_active = FALSE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get child roles
  getChildRoles: async (parentId) => {
    const result = await db.query(
      `SELECT r.* FROM roles r
       JOIN role_hierarchy rh ON r.id = rh.child_role_id
       WHERE rh.parent_role_id = $1`,
      [parentId]
    );
    return result.rows;
  },

  // Get parent roles
  getParentRoles: async (childId) => {
    const result = await db.query(
      `SELECT r.* FROM roles r
       JOIN role_hierarchy rh ON r.id = rh.parent_role_id
       WHERE rh.child_role_id = $1`,
      [childId]
    );
    return result.rows;
  },
};
module.exports = Role;
