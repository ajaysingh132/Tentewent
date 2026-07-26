const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const jwtService = {
  // Generate access token
  generateAccessToken: (user) => {
    return jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        type: 'access',
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.accessExpiry }
    );
  },

  // Generate refresh token
  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.refreshExpiry }
    );
  },

  // Verify token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      return null;
    }
  },

  // Generate both tokens
  generateTokens: (user) => {
    return {
      accessToken: jwtService.generateAccessToken(user),
      refreshToken: jwtService.generateRefreshToken(user),
    };
  },
};

module.exports = jwtService;
