import { query } from '../../config/database.js';
import { hashToken } from '../../utils/helpers.js';

/**
 * Find user by email
 */
export const findByEmail = async (email) => {
    const result = await query(
        `SELECT id, email, password_hash, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url, created_at
     FROM users WHERE email = $1`,
        [email.toLowerCase()]
    );
    return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findById = async (id) => {
    const result = await query(
        `SELECT id, email, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url, created_at
     FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Find user by Google ID
 */
export const findByGoogleId = async (googleId) => {
    const result = await query(
        `SELECT id, email, password_hash, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url, created_at
     FROM users WHERE google_id = $1`,
        [googleId]
    );
    return result.rows[0] || null;
};

/**
 * Create a new user
 */
export const create = async ({ email, passwordHash = null, fullName, phone, role, tenantId = null, googleId = null, avatarUrl = null }) => {
    const result = await query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, email, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url, created_at`,
        [email.toLowerCase(), passwordHash, fullName, phone || null, role, tenantId, role === 'super_admin' || !!googleId, googleId, avatarUrl]
    );
    return result.rows[0];
};

/**
 * Update user
 */
export const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.fullName !== undefined) {
        fields.push(`full_name = $${paramCount++}`);
        values.push(data.fullName);
    }
    if (data.phone !== undefined) {
        fields.push(`phone = $${paramCount++}`);
        values.push(data.phone);
    }
    if (data.isVerified !== undefined) {
        fields.push(`is_verified = $${paramCount++}`);
        values.push(data.isVerified);
    }
    if (data.tenantId !== undefined) {
        fields.push(`tenant_id = $${paramCount++}`);
        values.push(data.tenantId);
    }
    if (data.googleId !== undefined) {
        fields.push(`google_id = $${paramCount++}`);
        values.push(data.googleId);
    }
    if (data.avatarUrl !== undefined) {
        fields.push(`avatar_url = $${paramCount++}`);
        values.push(data.avatarUrl);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}
     RETURNING id, email, full_name, phone, role, tenant_id, is_verified, google_id, avatar_url`,
        values
    );
    return result.rows[0];
};

/**
 * Store refresh token
 */
export const createRefreshToken = async (userId, tokenHash, expiresAt) => {
    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
    );
};

/**
 * Find refresh token
 */
export const findRefreshToken = async (tokenHash) => {
    const result = await query(
        `SELECT rt.id, rt.user_id, rt.expires_at, rt.is_revoked,
            u.email, u.full_name, u.role, u.tenant_id, u.is_verified
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
        [tokenHash]
    );
    return result.rows[0] || null;
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (tokenHash) => {
    await query(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1',
        [tokenHash]
    );
};

/**
 * Revoke all user's refresh tokens
 */
export const revokeAllUserTokens = async (userId) => {
    await query(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
        [userId]
    );
};

/**
 * Clean up expired tokens
 */
export const cleanupExpiredTokens = async () => {
    await query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
    );
};

/**
 * Update user password hash
 */
export const updatePassword = async (id, passwordHash) => {
    const result = await query(
        `UPDATE users SET password_hash = $1 WHERE id = $2
     RETURNING id, email, full_name, role`,
        [passwordHash, id]
    );
    return result.rows[0];
};

export default {
    findByEmail,
    findById,
    findByGoogleId,
    create,
    update,
    updatePassword,
    createRefreshToken,
    findRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanupExpiredTokens,
};
