import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleRedirect = (result) => {
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
                navigate('/bookings', { replace: true });
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
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
            handleRedirect(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed');
        } finally {
            setGoogleLoading(false);
        }
    };

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
                    id="email"
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
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
