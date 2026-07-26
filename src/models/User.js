const db = require('../config/db');

const User = {
  // Create new user
  create: async (userData) => {
    const {
      phone, email, password_hash, full_name, profile_image,
      role, city_id, is_verified
    } = userData;

    const query = `
      INSERT INTO users (phone, email, password_hash, full_name, profile_image, role, city_id, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, phone, email, full_name, role, is_verified, created_at
    `;
    const values = [phone, email, password_hash, full_name, profile_image, role || 'customer', city_id, is_verified || false];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find by phone
  findByPhone: async (phone) => {
    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  },

  // Find by email
  findByEmail: async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Find by ID
  findById: async (id) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update user
  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  },

  // Update last login
  updateLastLogin: async (id) => {
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  },

  // Save device token
  saveDeviceToken: async (userId, deviceToken, platform) => {
    const query = `
      INSERT INTO user_devices (user_id, device_token, platform)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, device_token) DO UPDATE SET platform = $3
    `;
    await db.query(query, [userId, deviceToken, platform]);
  },
};

module.exports = User;
