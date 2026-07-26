const bcrypt = require('bcryptjs');
const User = require('../models/User');
const otpService = require('../services/otpService');
const jwtService = require('../services/jwtService');
const firebaseService = require('../services/firebaseService');
const { successResponse, errorResponse } = require('../utils/response');

const authController = {
  // POST /api/v1/auth/send-otp
  sendOtp: async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        return errorResponse(res, 'Invalid phone number', 400);
      }
      const result = await otpService.sendOtp(phone, 'login');
      return successResponse(res, result.message, { phone });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/verify-otp
  verifyOtp: async (req, res) => {
    try {
      const { phone, otp, deviceToken, platform } = req.body;

      // Verify OTP
      const verification = await otpService.verifyOtp(phone, otp, 'login');
      if (!verification.success) {
        return errorResponse(res, verification.message, 401);
      }

      // Check if user exists
      let user = await User.findByPhone(phone);

      // Auto-register if new user
      if (!user) {
        user = await User.create({
          phone,
          full_name: `User_${phone.slice(-4)}`,
          role: 'customer',
          is_verified: true,
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Save device token      if (deviceToken) {
        await User.saveDeviceToken(user.id, deviceToken, platform || 'android');
      }

      // Generate tokens
      const tokens = jwtService.generateTokens(user);

      return successResponse(res, 'Login successful', {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
        },
        ...tokens,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/login/password
  loginWithPassword: async (req, res) => {
    try {
      const { phone, password } = req.body;
      const user = await User.findByPhone(phone);
      if (!user) return errorResponse(res, 'User not found', 404);

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return errorResponse(res, 'Invalid credentials', 401);

      await User.updateLastLogin(user.id);
      const tokens = jwtService.generateTokens(user);

      return successResponse(res, 'Login successful', { user, ...tokens });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/register
  register: async (req, res) => {
    try {
      const { phone, password, full_name, email, role } = req.body;

      // Check existing user
      const existing = await User.findByPhone(phone);
      if (existing) return errorResponse(res, 'Phone already registered', 409);
      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        phone,
        email,
        password_hash,
        full_name,
        role: role || 'customer',
        is_verified: true,
      });

      const tokens = jwtService.generateTokens(user);
      return successResponse(res, 'Registration successful', { user, ...tokens }, 201);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/firebase-login
  firebaseLogin: async (req, res) => {
    try {
      const { idToken, deviceToken, platform } = req.body;

      // Verify Firebase token
      const fbUser = await firebaseService.verifyIdToken(idToken);
      if (!fbUser.success) {
        return errorResponse(res, fbUser.message, 401);
      }

      // Find or create user
      let user = fbUser.phone
        ? await User.findByPhone(fbUser.phone)
        : await User.findByEmail(fbUser.email);

      if (!user) {
        user = await User.create({
          phone: fbUser.phone,
          email: fbUser.email,
          full_name: fbUser.email?.split('@')[0] || 'Google User',
          role: 'customer',
          is_verified: true,
        });
      }

      await User.updateLastLogin(user.id);
      if (deviceToken) await User.saveDeviceToken(user.id, deviceToken, platform);

      const tokens = jwtService.generateTokens(user);      return successResponse(res, 'Firebase login successful', { user, ...tokens });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/refresh-token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const decoded = jwtService.verifyToken(refreshToken);

      if (!decoded || decoded.type !== 'refresh') {
        return errorResponse(res, 'Invalid refresh token', 401);
      }

      const user = await User.findById(decoded.userId);
      if (!user) return errorResponse(res, 'User not found', 404);

      const tokens = jwtService.generateTokens(user);
      return successResponse(res, 'Token refreshed', tokens);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // GET /api/v1/auth/me
  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) return errorResponse(res, 'User not found', 404);

      const { password_hash, ...safeUser } = user;
      return successResponse(res, 'User profile', safeUser);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },

  // POST /api/v1/auth/logout
  logout: async (req, res) => {
    try {
      const { deviceToken } = req.body;
      if (deviceToken) {
        const db = require('../config/db');
        await db.query(
          'DELETE FROM user_devices WHERE user_id = $1 AND device_token = $2',
          [req.user.userId, deviceToken]
        );
      }      return successResponse(res, 'Logged out successfully');
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  },
};

module.exports = authController;
