import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AlertCircle, ArrowRight, User } from 'lucide-react';

const SAVED_USER_KEY = 'washco_saved_user';

function getSavedUser() {
    try {
        const raw = localStorage.getItem(SAVED_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveUser(user) {
    localStorage.setItem(SAVED_USER_KEY, JSON.stringify({
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl || null,
    }));
}

function clearSavedUser() {
    localStorage.removeItem(SAVED_USER_KEY);
}

export default function LoginPage() {
    const savedUser = getSavedUser();
    const [returningMode, setReturningMode] = useState(!!savedUser);

    // Full form state
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    // Returning user state
    const [returnPassword, setReturnPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleRedirect = (result) => {
        // Save user for remember-me
        if (result?.user) {
            saveUser(result.user);
        }

        if (from !== '/' && from !== '/login') {
            navigate(from, { replace: true });
            return;
        }
        const userRole = result?.user?.role || result?.role;
        switch (userRole) {
            case 'super_admin':
                navigate('/admin', { replace: true });
                break;
            case 'manager':
                navigate('/manager', { replace: true });
                break;
            case 'customer':
            default:
                navigate('/', { replace: true });
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(identifier, password);
            handleRedirect(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleReturningSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(savedUser.email, returnPassword);
            handleRedirect(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle(credentialResponse.credential);
            if (result?.user) saveUser(result.user);
            handleRedirect(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const switchToFullForm = () => {
        clearSavedUser();
        setReturningMode(false);
        setError('');
        setReturnPassword('');
    };

    // Returning user — password-only mode
    if (returningMode && savedUser) {
        return (
            <AuthLayout
                title="Welcome Back"
                subtitle="Enter your password to continue"
            >
                <motion.div
                    className="returning-user-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="returning-user-info">
                        {savedUser.avatarUrl ? (
                            <img src={savedUser.avatarUrl} alt="" className="returning-avatar" />
                        ) : (
                            <div className="returning-avatar-fallback">
                                <User size={24} />
                            </div>
                        )}
                        <div className="returning-details">
                            <span className="returning-name">{savedUser.fullName}</span>
                            <span className="returning-email">{savedUser.email}</span>
                        </div>
                    </div>
                </motion.div>

                <form onSubmit={handleReturningSubmit} className="auth-form">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="auth-error-alert"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    <Input
                        id="returnPassword"
                        type="password"
                        label="Password"
                        value={returnPassword}
                        onChange={(e) => setReturnPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="auth-submit-btn"
                        disabled={loading || googleLoading}
                    >
                        {loading ? (
                            <span className="btn-content">
                                <span className="spinner-sm" />
                                Signing in...
                            </span>
                        ) : (
                            <span className="btn-content">
                                Sign In <ArrowRight size={18} />
                            </span>
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                {/* Google Sign-In */}
                <div className="google-btn-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign-in failed')}
                        theme="filled_black"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="pill"
                    />
                </div>

                <div className="auth-footer">
                    <button
                        type="button"
                        onClick={switchToFullForm}
                        className="auth-link switch-account-btn"
                    >
                        Not {savedUser.fullName?.split(' ')[0]}? Use a different account
                    </button>
                </div>
            </AuthLayout>
        );
    }

    // Full login form — new user or switched account
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to manage your car wash bookings"
        >
            <form onSubmit={handleSubmit} className="auth-form">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="auth-error-alert"
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <Input
                    id="identifier"
                    type="text"
                    label="Email or Phone Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or +1234567890"
                    required
                />

                <div className="auth-field-group">
                    <div className="auth-label-row">
                        <label htmlFor="password" className="input-label">Password</label>
                        <Link to="#" className="auth-forgot-link">
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="no-label-margin"
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="auth-submit-btn"
                    disabled={loading || googleLoading}
                >
                    {loading ? (
                        <span className="btn-content">
                            <span className="spinner-sm" />
                            Signing in...
                        </span>
                    ) : (
                        <span className="btn-content">
                            Sign In <ArrowRight size={18} />
                        </span>
                    )}
                </Button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
                <span>or</span>
            </div>

            {/* Google Sign-In */}
            <div className="google-btn-wrapper">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed')}
                    theme="filled_black"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="pill"
                />
            </div>

            <div className="auth-footer">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                    Create account
                </Link>
            </div>
        </AuthLayout>
    );
}
