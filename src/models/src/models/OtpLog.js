const db = require('../config/db');

const OtpLog = {
  // Create OTP entry
  create: async (phone, otp, purpose = 'login') => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    const query = `
      INSERT INTO otp_logs (phone, otp, purpose, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [phone, otp, purpose, expiresAt]);
    return result.rows[0];
  },

  // Verify OTP
  verify: async (phone, otp, purpose = 'login') => {
    const query = `
      UPDATE otp_logs
      SET is_used = TRUE
      WHERE phone = $1 AND otp = $2 AND purpose = $3
        AND is_used = FALSE AND expires_at > NOW()
      RETURNING *
    `;
    const result = await db.query(query, [phone, otp, purpose]);
    return result.rows[0];
  },

  // Mark all previous OTPs as used
  invalidatePrevious: async (phone, purpose) => {
    await db.query(
      'UPDATE otp_logs SET is_used = TRUE WHERE phone = $1 AND purpose = $2 AND is_used = FALSE',
      [phone, purpose]
    );
  },
};

module.exports = OtpLog;
