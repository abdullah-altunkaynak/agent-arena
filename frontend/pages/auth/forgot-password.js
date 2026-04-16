import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email.trim()) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setSuccess(true);
                setEmail('');
            } else {
                setError('Failed to process request. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <Head>
                    <title>Password Reset Email Sent - Agent Arena</title>
                </Head>

                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md text-center">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 border border-blue-500 rounded-full mb-4">
                                <svg
                                    className="w-8 h-8 text-blue-400"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
                            <p className="text-gray-400">We've sent a password reset link</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                            <p className="text-gray-300 mb-6">
                                If an account exists for the email address you entered, you will receive a password reset link within minutes.
                            </p>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                                <p className="text-blue-300 text-sm">
                                    <strong>💡 Tip:</strong> Check your spam folder if you don't see the email.
                                </p>
                            </div>

                            <Link
                                href="/auth/signin"
                                className="inline-block py-2 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition"
                            >
                                Back to Sign In
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
                <title>Forgot Password - Agent Arena</title>
                <meta name="description" content="Reset your Agent Arena password." />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-gray-400">Enter your email to receive a reset link</p>
                    </div>

                    {/* Form */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    placeholder="your@email.com"
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        {/* Back to Sign In */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            Remember your password?{' '}
                            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
