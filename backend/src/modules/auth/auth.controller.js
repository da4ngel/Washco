import * as authService from './auth.service.js';
import { createAuditLog } from '../../utils/audit.js';
import { getClientIp } from '../../utils/helpers.js';
import config from '../../config/env.js';
import { cloudinary, useCloudinary } from '../../config/cloudinary.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
    try {
        const { email, password, fullName, phone, role } = req.body;

        // Only allow customer registration by default
        // Manager registration creates a pending tenant
        const allowedRoles = ['customer', 'manager'];
        const userRole = allowedRoles.includes(role) ? role : 'customer';

        const user = await authService.register({
            email,
            password,
            fullName,
            phone,
            role: userRole,
        });

        await createAuditLog({
            userId: user.id,
            action: 'REGISTER',
            entityType: 'user',
            entityId: user.id,
            newValues: { email, role: userRole },
            ipAddress: getClientIp(req),
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        const result = await authService.login({ identifier, password });

        await createAuditLog({
            userId: result.user.id,
            tenantId: result.user.tenantId,
            action: 'LOGIN',
            entityType: 'user',
            entityId: result.user.id,
            ipAddress: getClientIp(req),
        });

        // Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth',
        });

        res.json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Google Sign-In
 */
export const googleSignIn = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        const result = await authService.googleSignIn({ idToken });

        await createAuditLog({
            userId: result.user.id,
            tenantId: result.user.tenantId,
            action: 'GOOGLE_LOGIN',
            entityType: 'user',
            entityId: result.user.id,
            ipAddress: getClientIp(req),
        });

        // Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/auth',
        });

        res.json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 */
export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const result = await authService.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout(refreshToken);

        if (req.user) {
            await createAuditLog({
                userId: req.user.id,
                tenantId: req.user.tenantId,
                action: 'LOGOUT',
                entityType: 'user',
                entityId: req.user.id,
                ipAddress: getClientIp(req),
            });
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            path: '/api/auth',
        });

        res.json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req, res, next) => {
    try {
        await authService.logoutAll(req.user.id);

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            action: 'LOGOUT_ALL',
            entityType: 'user',
            entityId: req.user.id,
            ipAddress: getClientIp(req),
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            path: '/api/auth',
        });

        res.json({
            success: true,
            message: 'Logged out from all devices.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
    try {
        const profile = await authService.getProfile(req.user.id);

        res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone } = req.body;

        const user = await authService.updateProfile(req.user.id, {
            fullName,
            phone,
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided.' });
        }

        let avatarUrl;

        if (useCloudinary) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'washco/avatars', public_id: `${req.user.id}-${Date.now()}`, resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            avatarUrl = result.secure_url;
        } else {
            avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        await authService.updateProfile(req.user.id, { avatarUrl });

        res.json({
            success: true,
            message: 'Avatar uploaded successfully.',
            data: { avatarUrl },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Change user password
 */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    register,
    login,
    googleSignIn,
    refresh,
    logout,
    logoutAll,
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
};
