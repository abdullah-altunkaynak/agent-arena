import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, AlertCircle, CheckCircle } from 'react-feather';

export default function CreateThreadPage() {
    const router = useRouter();
    const { id: communityId, categoryId: queryCategoryId } = router.query;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [community, setCommunity] = useState(null);

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/auth/signin?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        if (communityId && queryCategoryId) {
            fetchCategories();
            fetchCommunity();
            setCategoryId(queryCategoryId);
        }
    }, [communityId, queryCategoryId]);

    const fetchCommunity = async () => {
        try {
            const response = await fetch(`/api/community/communities/${communityId}`, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setCommunity(data);
            }
        } catch (err) {
            console.error('Failed to fetch community:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/community/communities/${communityId}/categories`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data);

            // Pre-select category if provided in URL
            if (queryCategoryId) {
                setCategoryId(queryCategoryId);
            } else if (data.length > 0) {
                setCategoryId(data[0].id);
            }

            setError(null);
        } catch (err) {
            console.error('Fetch categories error:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    // Title validation
    const titleError =
        title && title.length < 3
            ? 'Title must be at least 3 characters'
            : title && title.length > 255
                ? 'Title must be less than 255 characters'
                : null;

    // Content validation
    const contentError =
        content && content.length < 10
            ? 'Content must be at least 10 characters'
            : content && content.length > 10000
                ? 'Content must be less than 10,000 characters'
                : null;

    const canSubmit =
        title.length >= 3 &&
        content.length >= 10 &&
        categoryId &&
        !submitting &&
        !titleError &&
        !contentError;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canSubmit) return;

        try {
            setSubmitting(true);
            setError(null);

            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/threads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    category_id: categoryId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create thread');
            }

            const thread = await response.json();
            setSuccess(true);

            // Redirect after success
            setTimeout(() => {
                router.push(`/community/${communityId}/thread/${thread.id}`);
            }, 1500);
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to create thread');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Create Discussion - Agent Arena</title>
                <meta name="description" content="Create a new discussion" />
                <meta name="robots" content="noindex" />
            </Head>

            <Navbar />

            <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen pb-16 pt-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header with Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>

                    {/* Success State */}
                    {success && (
                        <Card className="bg-green-500/10 border-green-500/20 p-8 mb-8 text-center">
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                            <h2 className="text-2xl font-bold text-green-300 mb-2">Discussion Created!</h2>
                            <p className="text-green-200">Redirecting to your discussion...</p>
                        </Card>
                    )}

                    {/* Main Card */}
                    <Card className="border-slate-700">
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Start a New Discussion</h1>
                            <p className="text-gray-400 mb-8">
                                Share your thoughts and engage with the community
                            </p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex gap-3">
                                    <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-300">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Category <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        disabled={categories.length === 1}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    {categories.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            {categories.find((c) => c.id === categoryId)?.description ||
                                                'Select a category to continue'}
                                        </p>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Title <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="What's on your mind?"
                                            maxLength="255"
                                            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${titleError
                                                    ? 'border-red-500/50 focus:border-red-500'
                                                    : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                                }`}
                                        />
                                        {title && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <span className={`text-xs font-medium ${title.length <= 80
                                                        ? 'text-green-400'
                                                        : title.length <= 200
                                                            ? 'text-blue-400'
                                                            : 'text-yellow-400'
                                                    }`}>
                                                    {title.length}/255
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-start justify-between">
                                        {titleError && (
                                            <p className="text-xs text-red-400">{titleError}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            {title ? `${title.length} characters` : 'At least 3 characters required'}
                                        </p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Description <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Share your thoughts, ask questions, or start a discussion..."
                                            maxLength="10000"
                                            rows="10"
                                            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors resize-none ${contentError
                                                    ? 'border-red-500/50 focus:border-red-500'
                                                    : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                                }`}
                                        />
                                        {content && (
                                            <div className="absolute right-3 top-3">
                                                <span className={`text-xs font-medium ${content.length <= 3000
                                                        ? 'text-green-400'
                                                        : content.length <= 7000
                                                            ? 'text-blue-400'
                                                            : 'text-yellow-400'
                                                    }`}>
                                                    {content.length}/10000
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-start justify-between">
                                        {contentError && (
                                            <p className="text-xs text-red-400">{contentError}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            {content ? `${content.length} characters` : 'At least 10 characters required'}
                                        </p>
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-blue-300 mb-2">💡 Tips for a great discussion:</p>
                                    <ul className="text-sm text-blue-200 space-y-1 list-inside list-disc">
                                        <li>Be clear and specific with your title</li>
                                        <li>Provide context and details in the description</li>
                                        <li>Be respectful and constructive</li>
                                        <li>Avoid spam or off-topic content</li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-6 border-t border-slate-700">
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={`flex-1 ${canSubmit
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-slate-700 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        {submitting ? 'Creating...' : 'Create Discussion'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>

                    {/* Character Count Legend */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>💚 Good—🔵 Better—⚠️ Okay length</p>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
