import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ResetPassword() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Get token from URL
    useEffect(() => {
        if (router.query.token) {
            setToken(router.query.token);
        }
    }, [router.query.token]);

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) strength++;
        setPasswordStrength(strength);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'new_password') {
            calculatePasswordStrength(value);
        }

        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.new_password) {
            newErrors.new_password = 'Password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 3) {
            newErrors.new_password = 'Password must contain uppercase, lowercase, numbers, and special characters';
        }

        if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setErrors({ submit: 'Invalid reset link. Please request a new one.' });
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: formData.new_password,
                    confirm_password: formData.confirm_password,
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/auth/signin');
                }, 2000);
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.detail || 'Failed to reset password' });
            }
        } catch (error) {
            setErrors({ submit: 'An error occurred. Please try again.' });
            console.error('Reset password error:', error);
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

    if (success) {
        return (
            <>
                <Head>
                    <title>Password Reset Successful - Agent Arena</title>
                </Head>

                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md text-center">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500 rounded-full mb-4">
                                <svg
                                    className="w-8 h-8 text-green-400"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Password Reset!</h1>
                            <p className="text-gray-400">Your password has been successfully reset</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                            <p className="text-gray-300 mb-6">
                                You can now sign in with your new password.
                            </p>

                            <p className="text-gray-500 text-sm">
                                Redirecting to sign in in a few seconds...
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!token) {
        return (
            <>
                <Head>
                    <title>Invalid Reset Link - Agent Arena</title>
                </Head>

                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md text-center">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Invalid Link</h1>
                            <p className="text-gray-400">This password reset link is invalid or expired</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                            <Link
                                href="/auth/forgot-password"
                                className="inline-block py-2 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition"
                            >
                                Request New Link
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Reset Password - Agent Arena</title>
                <meta name="description" content="Reset your Agent Arena password." />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
                        <p className="text-gray-400">Enter your new password below</p>
                    </div>

                    {/* Form */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                        {errors.submit && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-300 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New Password */}
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-300 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="new_password"
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.new_password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Create a strong password"
                                    disabled={loading}
                                />
                                {formData.new_password && (
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
                                {errors.new_password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.new_password}</p>
                                )}
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
                                    placeholder="Confirm your new password"
                                    disabled={loading}
                                />
                                {errors.confirm_password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.confirm_password}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>

                        {/* Back to Sign In */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
                                Back to Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
