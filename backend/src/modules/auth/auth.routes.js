import { Router } from 'express';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validator.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { useCloudinary } from '../../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for avatar uploads
let storage;
if (useCloudinary) {
    storage = multer.memoryStorage();
} else {
    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${req.user.id}-${Date.now()}${ext}`);
        },
    });
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype.split('/')[1]);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    },
});

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{8,20}$/).optional().messages({
        'string.pattern.base': 'Phone number must be 8-20 digits',
    }),
    role: Joi.string().valid('customer').optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const googleSignInSchema = Joi.object({
    idToken: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-]{10,20}$/).allow(null, '').optional(),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().allow('').optional(),
    newPassword: Joi.string().min(8).max(128).required(),
});

// Routes
router.post(
    '/register',
    authLimiter,
    validateBody(registerSchema),
    authController.register
);

router.post(
    '/login',
    authLimiter,
    validateBody(loginSchema),
    authController.login
);

router.post('/refresh', authController.refresh);

router.post(
    '/google',
    authLimiter,
    validateBody(googleSignInSchema),
    authController.googleSignIn
);

router.post('/logout', authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/profile', authenticate, authController.getProfile);

router.patch(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    authController.updateProfile
);

router.post(
    '/profile/avatar',
    authenticate,
    upload.single('avatar'),
    authController.uploadAvatar
);

router.post(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    authController.changePassword
);

export default router;
