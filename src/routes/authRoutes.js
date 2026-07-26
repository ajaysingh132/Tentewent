const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validateMiddleware');

// Public routes
router.post('/send-otp', validate(schemas.sendOtp), authController.sendOtp);
router.post('/verify-otp', validate(schemas.verifyOtp), authController.verifyOtp);
router.post('/register', validate(schemas.register), authController.register);
router.post('/login/password', validate(schemas.loginPassword), authController.loginWithPassword);
router.post('/firebase-login', validate(schemas.firebaseLogin), authController.firebaseLogin);
router.post('/refresh-token', validate(schemas.refreshToken), authController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
