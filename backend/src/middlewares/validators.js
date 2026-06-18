/**
 * Joi validation schemas + Express middleware for critical API endpoints.
 * 
 * Usage in routes:
 *   const { validate, schemas } = require('../middlewares/validators');
 *   router.post('/register', validate(schemas.register), authController.register);
 */

const Joi = require('joi');

// ─── Validation Middleware Factory ──────────────────────────────────────────
/**
 * Returns Express middleware that validates req.body against the given Joi schema.
 * On failure, responds with 400 + the first validation error message.
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = source === 'body' ? req.body : req.query;
        const { error } = schema.validate(data, { abortEarly: true, allowUnknown: true });

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

// ─── Schemas ────────────────────────────────────────────────────────────────

const schemas = {
    // Auth: Register
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
        password: Joi.string().min(6).max(128).required().messages({
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password must be at most 128 characters',
            'any.required': 'Password is required',
        }),
        full_name: Joi.string().max(150).required().messages({
            'any.required': 'Full name is required',
            'string.max': 'Full name must be at most 150 characters',
        }),
        phone: Joi.string().pattern(/^[0-9+\-\s()]*$/).max(20).allow('', null).messages({
            'string.pattern.base': 'Phone number contains invalid characters',
        }),
    }),

    // Auth: Login
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required',
        }),
    }),

    // Auth: Forgot Password
    forgotPassword: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    }),

    // Auth: Reset Password
    resetPassword: Joi.object({
        email: Joi.string().email().required(),
        token: Joi.string().length(6).required().messages({
            'string.length': 'Reset code must be 6 digits',
            'any.required': 'Reset code is required',
        }),
        new_password: Joi.string().min(6).max(128).required().messages({
            'string.min': 'Password must be at least 6 characters',
        }),
    }),

    // Auth: Change Password
    changePassword: Joi.object({
        current_password: Joi.string().required().messages({
            'any.required': 'Current password is required',
        }),
        new_password: Joi.string().min(6).max(128).required().messages({
            'string.min': 'New password must be at least 6 characters',
        }),
    }),

    // Property: Create
    createProperty: Joi.object({
        title: Joi.string().max(300).required().messages({
            'any.required': 'Property title is required',
            'string.max': 'Title must be at most 300 characters',
        }),
        price_usd: Joi.number().positive().required().messages({
            'any.required': 'Price is required',
            'number.positive': 'Price must be a positive number',
        }),
        listing_type: Joi.string().valid('sale', 'rent').default('sale'),
        description: Joi.string().max(10000).allow('', null),
        property_type: Joi.string().max(100).allow('', null),
        area_sqm: Joi.number().positive().allow(null),
        bedrooms: Joi.number().integer().min(0).allow(null),
        bathrooms: Joi.number().integer().min(0).allow(null),
        address: Joi.string().max(500).allow('', null),
        city: Joi.string().max(150).allow('', null),
        zipcode: Joi.string().max(20).allow('', null),
        district_id: Joi.number().integer().allow(null),
        direction: Joi.string().valid(
            'north', 'south', 'east', 'west',
            'northeast', 'northwest', 'southeast', 'southwest'
        ).allow('', null),
        video_url: Joi.string().uri().max(500).allow('', null),
        latitude: Joi.number().min(-90).max(90).allow(null),
        longitude: Joi.number().min(-180).max(180).allow(null),
    }),

    // Reports: Submit
    submitReport: Joi.object({
        property_id: Joi.number().integer().required(),
        reason: Joi.string().max(100).required(),
        details: Joi.string().max(2000).allow('', null),
    }),
};

module.exports = { validate, schemas };
