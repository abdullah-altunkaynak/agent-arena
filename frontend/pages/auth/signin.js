import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignIn() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email_or_username: '',
        password: '',
        remember_me: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email_or_username.trim()) {
            newErrors.email_or_username = 'Email or username is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard or community
                router.push('/community');
            } else {
                const errorData = await response.json();
                setErrors({ submit: errorData.detail || 'Login failed' });
            }
        } catch (error) {
            setErrors({ submit: 'An error occurred. Please try again.' });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign In - Agent Arena Community</title>
                <meta name="description" content="Sign in to Agent Arena community. Connect with other AI enthusiasts." />
                <meta name="og:title" content="Sign In - Agent Arena" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Agent Arena</h1>
                        <p className="text-gray-400">Welcome back</p>
                    </div>

                    {/* Form */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                        {errors.submit && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-300 text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email or Username */}
                            <div>
                                <label htmlFor="email_or_username" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email or Username
                                </label>
                                <input
                                    type="text"
                                    id="email_or_username"
                                    name="email_or_username"
                                    value={formData.email_or_username}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.email_or_username ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="your@email.com or username"
                                    disabled={loading}
                                    autoComplete="email"
                                />
                                {errors.email_or_username && (
                                    <p className="text-red-400 text-xs mt-1">{errors.email_or_username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                        Password
                                    </label>
                                    <Link href="/auth/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                                        Forgot?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Your password"
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="remember_me"
                                    name="remember_me"
                                    checked={formData.remember_me}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 bg-slate-700/50 border border-slate-600 rounded cursor-pointer"
                                    disabled={loading}
                                />
                                <label htmlFor="remember_me" className="text-sm text-gray-400 cursor-pointer">
                                    Remember me
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-slate-600"></div>
                                <span className="text-xs text-gray-500">OR</span>
                                <div className="flex-1 h-px bg-slate-600"></div>
                            </div>

                            {/* Social Login (Placeholder) */}
                            <button
                                type="button"
                                disabled={loading}
                                className="w-full py-2 px-4 border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sign in with Google
                            </button>
                        </form>

                        {/* Sign Up Link */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            Don't have an account?{' '}
                            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                                Create one here
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-xs mt-6">
                        By signing in, you agree to our&nbsp;
                        <Link href="/terms-of-service" className="text-gray-400 hover:text-gray-300">
                            Terms of Service
                        </Link>
                        &nbsp;and&nbsp;
                        <Link href="/privacy-policy" className="text-gray-400 hover:text-gray-300">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
