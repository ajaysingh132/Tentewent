const crypto = require('crypto');
const OtpLog = require('../models/OtpLog');

const otpService = {
  // Generate random OTP
  generateOtp: (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  },

  // Send OTP (Firebase / SMS gateway)
  sendOtp: async (phone, purpose = 'login') => {
    // Invalidate previous OTPs
    await OtpLog.invalidatePrevious(phone, purpose);

    const otp = otpService.generateOtp();
    await OtpLog.create(phone, otp, purpose);

    // TODO: Integrate SMS gateway (Twilio / MSG91 / Firebase)
    // For now, log OTP (remove in production)
    console.log(`📱 OTP for ${phone}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      // In production, NEVER return OTP
    };
  },

  // Verify OTP
  verifyOtp: async (phone, otp, purpose = 'login') => {
    const record = await OtpLog.verify(phone, otp, purpose);
    if (!record) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    return { success: true, message: 'OTP verified' };
  },
};

module.exports = otpService;
