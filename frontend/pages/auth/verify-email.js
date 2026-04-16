import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function VerifyEmail() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    // Get email from localStorage and check if token is in URL
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setEmail(user.email);
        }

        // Check if token is in query string
        if (router.query.token) {
            setToken(router.query.token);
            verifyEmailWithToken(router.query.token);
        }
    }, [router.query.token]);

    const verifyEmailWithToken = async (verifyToken) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: verifyToken }),
            });

            if (response.ok) {
                setVerified(true);
                // Update user profile to mark email as verified
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.email_verified = true;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                // Redirect to community after 3 seconds
                setTimeout(() => {
                    router.push('/community');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Email verification failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();

        if (!token.trim()) {
            setError('Please enter the verification code');
            return;
        }

        await verifyEmailWithToken(token);
    };

    const handleResendEmail = async () => {
        setResendLoading(true);
        setError('');
        setResendSuccess(false);

        try {
            // In production, you'd have an endpoint to resend verification
            // For now, we'll simulate it
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResendSuccess(true);
                setTimeout(() => setResendSuccess(false), 5000);
            } else {
                setError('Failed to resend verification email');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Resend error:', err);
        } finally {
            setResendLoading(false);
        }
    };

    if (verified) {
        return (
            <>
                <Head>
                    <title>Email Verified - Agent Arena</title>
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
                            <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
                            <p className="text-gray-400">Your email has been successfully verified</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                            <p className="text-gray-300 mb-6">
                                Welcome to Agent Arena! You're all set to start exploring our community.
                            </p>

                            <button
                                onClick={() => router.push('/community')}
                                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition"
                            >
                                Go to Community
                            </button>

                            <p className="text-gray-500 text-sm mt-4">
                                Redirecting in a few seconds...
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Verify Email - Agent Arena</title>
                <meta name="description" content="Verify your email to complete your Agent Arena registration." />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
                        <p className="text-gray-400">
                            {email ? `We sent a link to ${email}` : 'Check your email for the verification link'}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-xl">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {resendSuccess && (
                            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4 text-green-300 text-sm">
                                Verification email sent! Check your inbox.
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                            <p className="text-blue-300 text-sm">
                                <strong>📧 Check your email</strong> for a verification link. Click it to verify your account.
                            </p>
                        </div>

                        {/* Manual Token Entry (Optional) */}
                        <form onSubmit={handleVerifySubmit} className="space-y-4">
                            <div>
                                <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">
                                    Verification Code (if link doesn't work)
                                </label>
                                <input
                                    type="text"
                                    id="token"
                                    value={token}
                                    onChange={(e) => {
                                        setToken(e.target.value);
                                        setError('');
                                    }}
                                    className={`w-full px-4 py-2 bg-slate-700/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-purple-500'
                                        }`}
                                    placeholder="Paste verification code here"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token.trim()}
                                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>

                        {/* Resend Email */}
                        <div className="mt-6 pt-6 border-t border-slate-600">
                            <p className="text-gray-400 text-sm mb-4">Didn't receive the email?</p>
                            <button
                                onClick={handleResendEmail}
                                disabled={resendLoading}
                                className="w-full py-2 px-4 border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                        </div>

                        {/* Back to Sign In */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
                                Back to Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-xs mt-6">
                        Check your spam folder if you can't find the email
                    </p>
                </div>
            </div>
        </>
    );
}
