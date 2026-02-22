import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer' // Default role
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(formData.name, formData.email, formData.password, formData.role);

            // Registration successful, redirect to login
            navigate('/login', {
                state: {
                    message: 'Account created successfully. Please sign in.'
                },
                replace: true
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle(credentialResponse.credential);
            // Google creates account + logs in, redirect based on role
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
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-up failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join WashCO for premium car care"
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

                <div className="auth-fields-stack">
                    <Input
                        id="name"
                        label="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />

                    <Input
                        id="email"
                        type="email"
                        label="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        required
                    />

                    <div className="auth-row-2">
                        <Input
                            id="password"
                            type="password"
                            label="Password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••"
                            required
                        />
                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirm"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••"
                            required
                        />
                    </div>
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
                            Creating Account...
                        </span>
                    ) : (
                        <span className="btn-content">
                            Get Started <ArrowRight size={18} />
                        </span>
                    )}
                </Button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
                <span>or</span>
            </div>

            {/* Google Sign-Up */}
            <div className="google-btn-wrapper">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-up failed')}
                    theme="filled_black"
                    size="large"
                    width="100%"
                    text="signup_with"
                    shape="pill"
                />
            </div>

            <div className="auth-footer">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
}
