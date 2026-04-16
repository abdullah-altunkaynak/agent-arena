import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirm_password: '',
        agree_terms: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) strength++;
        setPasswordStrength(strength);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'password') {
            calculatePasswordStrength(value);
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_\-]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 3) {
            newErrors.password = 'Password must contain uppercase, lowercase, numbers, and special characters';
        }

        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        if (!formData.agree_terms) {
            newErrors.agree_terms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setSuccessMessage('Account created successfully! Redirecting to verify email...');
                setTimeout(() => {
                    router.push('/auth/verify-email');
                }, 1500);
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.detail || 'Registration failed' });
            }
        } catch (error) {
            setErrors({ submit: 'An error occurred. Please try again.' });
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthLabel = () => {
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        return labels[passwordStrength] || '';
    };

    const getPasswordStrengthColor = () => {
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
        return colors[passwordStrength] || 'bg-gray-300';
    };

    return (
        <>
            <Head>
                <title>Sign Up - Agent Arena Community</title>
                <meta name="description" content="Join Agent Arena community. Create your account and connect with other AI enthusiasts." />
                <meta name="og:title" content="Sign Up - Agent Arena" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Agent Arena</h1>
                        <p className="text-gray-400">Join our community</p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 text-green-300">
                            {successMessage}
                        </div>
                    )}

                    {/* Form */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                        {errors.submit && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-300 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Choose your username"
                                    disabled={loading}
                                />
                                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="your@email.com"
                                    disabled={loading}
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                                    Full Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    placeholder="Your full name"
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Create a strong password"
                                    disabled={loading}
                                />
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${getPasswordStrengthColor()} transition-all`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-400">{getPasswordStrengthLabel()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            At least 8 characters, uppercase, lowercase, number, and special character required
                                        </p>
                                    </div>
                                )}
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm_password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Confirm your password"
                                    disabled={loading}
                                />
                                {errors.confirm_password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.confirm_password}</p>
                                )}
                            </div>

                            {/* Terms & Conditions */}
                            <div className="flex items-start gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="agree_terms"
                                    name="agree_terms"
                                    checked={formData.agree_terms}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 mt-1 bg-slate-700/50 border border-slate-600 rounded cursor-pointer"
                                    disabled={loading}
                                />
                                <label htmlFor="agree_terms" className="text-sm text-gray-400">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                                        Terms & Conditions
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                            {errors.agree_terms && <p className="text-red-400 text-xs ml-7 -mt-2">{errors.agree_terms}</p>}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        {/* Sign In Link */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            Already have an account?{' '}
                            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300 font-medium">
                                Sign in here
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-xs mt-6">
                        By signing up, you agree to our&nbsp;
                        <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
