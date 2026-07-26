const Joi = require('joi');
const { errorResponse } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation failed', 400, messages);
    }
    next();
  };
};

// Validation schemas
const schemas = {
  sendOtp: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  }),
  verifyOtp: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).required(),
    deviceToken: Joi.string().optional(),
    platform: Joi.string().valid('android', 'ios', 'web').optional(),
  }),
  register: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('customer', 'tent_owner').optional(),
  }),
  loginPassword: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    password: Joi.string().required(),
  }),
  firebaseLogin: Joi.object({
    idToken: Joi.string().required(),
    deviceToken: Joi.string().optional(),
    platform: Joi.string().optional(),
  }),
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = { validate, schemas };
