import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, uploadAvatar, changePassword } from '../../api/auth.api';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Calendar, Camera, Check, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    // Personal info state
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState('');
    const [infoError, setInfoError] = useState('');

    // Avatar state
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');

    const hasPassword = !user?.googleId || user?.passwordHash;

    // Get initials for avatar fallback
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);

        setAvatarLoading(true);
        try {
            const data = await uploadAvatar(file);
            updateUser({ avatarUrl: data.avatarUrl });
        } catch (err) {
            setInfoError(err.response?.data?.error || 'Failed to upload avatar');
            setAvatarPreview(null);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setInfoError('');
        setInfoSuccess('');
        setInfoLoading(true);

        try {
            await updateProfile({ fullName, phone: phone || null });
            updateUser({ fullName, phone });
            setInfoSuccess('Profile updated successfully!');
            setTimeout(() => setInfoSuccess(''), 3000);
        } catch (err) {
            setInfoError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setInfoLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');

        if (newPassword !== confirmPassword) {
            setPwdError('Passwords do not match');
            return;
        }

        setPwdLoading(true);
        try {
            await changePassword({ currentPassword, newPassword });
            setPwdSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPwdSuccess(''), 3000);
        } catch (err) {
            setPwdError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setPwdLoading(false);
        }
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : 'N/A';

    const roleBadge = {
        customer: { label: 'Customer', color: 'badge-blue' },
        manager: { label: 'Manager', color: 'badge-purple' },
        super_admin: { label: 'Super Admin', color: 'badge-red' },
    };

    const role = roleBadge[user?.role] || roleBadge.customer;

    return (
        <div className="profile-page">
            <div className="container">
                <motion.div
                    className="profile-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1>My Profile</h1>
                    <p className="profile-subtitle">Manage your account settings and preferences</p>
                </motion.div>

                <div className="profile-grid">
                    {/* Left Column — Avatar & Account Info */}
                    <motion.div
                        className="profile-sidebar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        {/* Avatar Card */}
                        <div className="profile-card avatar-card">
                            <div className="avatar-section" onClick={handleAvatarClick}>
                                <div className={`avatar-container ${avatarLoading ? 'uploading' : ''}`}>
                                    {(avatarPreview || user?.avatarUrl) ? (
                                        <img
                                            src={avatarPreview || user.avatarUrl}
                                            alt={user?.fullName}
                                            className="avatar-image"
                                        />
                                    ) : (
                                        <div className="avatar-initials">
                                            {getInitials(user?.fullName)}
                                        </div>
                                    )}
                                    <div className="avatar-overlay">
                                        <Camera size={20} />
                                        <span>Change</span>
                                    </div>
                                    {avatarLoading && (
                                        <div className="avatar-loading">
                                            <span className="spinner-sm" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden-input"
                                />
                            </div>
                            <h3 className="avatar-name">{user?.fullName}</h3>
                            <span className={`role-badge ${role.color}`}>{role.label}</span>
                        </div>

                        {/* Account Info Card */}
                        <div className="profile-card info-card">
                            <h3 className="card-title">Account Info</h3>
                            <div className="info-list">
                                <div className="info-item">
                                    <Mail size={16} />
                                    <div>
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{user?.email}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Shield size={16} />
                                    <div>
                                        <span className="info-label">Role</span>
                                        <span className="info-value" style={{ textTransform: 'capitalize' }}>
                                            {user?.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} />
                                    <div>
                                        <span className="info-label">Member Since</span>
                                        <span className="info-value">{memberSince}</span>
                                    </div>
                                </div>
                                {user?.googleId && (
                                    <div className="info-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        <div>
                                            <span className="info-label">Google</span>
                                            <span className="info-value connected">Connected</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column — Edit Forms */}
                    <motion.div
                        className="profile-main"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        {/* Personal Info Form */}
                        <div className="profile-card">
                            <div className="card-header">
                                <User size={20} />
                                <h3 className="card-title">Personal Information</h3>
                            </div>

                            <form onSubmit={handleInfoSubmit} className="profile-form">
                                {infoError && (
                                    <div className="profile-alert error">
                                        <AlertCircle size={16} />
                                        {infoError}
                                    </div>
                                )}
                                {infoSuccess && (
                                    <div className="profile-alert success">
                                        <Check size={16} />
                                        {infoSuccess}
                                    </div>
                                )}

                                <div className="form-group">
                                    <Input
                                        id="fullName"
                                        label="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <Input
                                        id="phone"
                                        label="Phone Number"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="input-label">Email Address</label>
                                    <div className="readonly-field">
                                        <Mail size={16} />
                                        {user?.email}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={infoLoading}
                                >
                                    {infoLoading ? (
                                        <span className="btn-content">
                                            <span className="spinner-sm" /> Saving...
                                        </span>
                                    ) : (
                                        <span className="btn-content">
                                            <Check size={16} /> Save Changes
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Change Password Form */}
                        <div className="profile-card">
                            <div className="card-header">
                                <Lock size={20} />
                                <h3 className="card-title">
                                    {hasPassword ? 'Change Password' : 'Set Password'}
                                </h3>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="profile-form">
                                {pwdError && (
                                    <div className="profile-alert error">
                                        <AlertCircle size={16} />
                                        {pwdError}
                                    </div>
                                )}
                                {pwdSuccess && (
                                    <div className="profile-alert success">
                                        <Check size={16} />
                                        {pwdSuccess}
                                    </div>
                                )}

                                {hasPassword && (
                                    <div className="form-group password-field">
                                        <Input
                                            id="currentPassword"
                                            label="Current Password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                )}

                                <div className="form-row-2">
                                    <div className="form-group password-field">
                                        <Input
                                            id="newPassword"
                                            label="New Password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <Input
                                            id="confirmPassword"
                                            label="Confirm New Password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={pwdLoading}
                                >
                                    {pwdLoading ? (
                                        <span className="btn-content">
                                            <span className="spinner-sm" /> Updating...
                                        </span>
                                    ) : (
                                        <span className="btn-content">
                                            <Lock size={16} /> {hasPassword ? 'Change Password' : 'Set Password'}
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
