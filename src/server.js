require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Stricter limit for OTP
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 3, // 3 OTPs per minute per IP
});
app.use('/api/v1/auth/send-otp', otpLimiter);

// ============ ROUTES ============
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎪 TentHouse OS API',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

app.use('/api/v1/auth', authRoutes);

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  logger.info(`🚀 TentHouse OS running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
});

module.exports = app;
