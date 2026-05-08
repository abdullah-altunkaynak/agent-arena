import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import CommunityXpToast from '@/components/community/CommunityXpToast';
import { ArrowLeft, Send } from 'lucide-react';
import { threadAPI, communityAPI } from '@/lib/communityAPI';
import { ensureSlug } from '@/lib/slug';
import { publishCommunityXpNotice } from '@/lib/communityXp';

export default function CreateThreadPage() {
    const router = useRouter();
    const { communityId, categoryId } = router.query;

    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const currentRole = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const role = localStorage.getItem('user_role');
        if (role) return role.toLowerCase();

        try {
            const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (parsedUser?.role) return String(parsedUser.role).toLowerCase();
        } catch {
            return null;
        }

        return null;
    }, []);

    useEffect(() => {
        if (!communityId) return;

        const token = localStorage.getItem('access_token');
        if (!token) {
            router.replace('/auth/signin?redirect=' + encodeURIComponent(router.asPath || '/community'));
            return;
        }

        const allowedRoles = ['admin', 'moderator', 'user', 'member'];
        if (currentRole && !allowedRoles.includes(currentRole)) {
            setError('Your role is not allowed to create a topic.');
            setLoading(false);
            return;
        }

        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/community/communities/${communityId}/categories`, {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Failed to fetch categories');

                const data = await response.json();
                setCategories(data);

                const initialCategory = typeof categoryId === 'string' ? categoryId : (data[0]?.id || '');
                setSelectedCategoryId(initialCategory);
                setError('');
            } catch (err) {
                console.error('Category fetch error:', err);
                setError('Could not load categories.');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [communityId, categoryId, currentRole, router]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedCategoryId) {
            setError('Please select a category.');
            return;
        }

        if (title.trim().length < 3) {
            setError('Topic title must be at least 3 characters.');
            return;
        }

        if (content.trim().length < 10) {
            setError('Topic content must be at least 10 characters.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccessMessage('');

            const progressBefore = await communityAPI.getGamificationProgress().catch(() => null);

            const createdThread = await threadAPI.createThread(
                title.trim(),
                content.trim(),
                selectedCategoryId
            );

            if (!createdThread?.id) {
                throw new Error('Topic was created but no topic id was returned.');
            }

            const progressAfter = await communityAPI.getGamificationProgress().catch(() => null);
            const pointsBefore = Number(progressBefore?.points_total || 0);
            const pointsAfter = Number(progressAfter?.points_total || 0);
            const levelBefore = Number(progressBefore?.level || 1);
            const levelAfter = Number(progressAfter?.level || levelBefore);

            publishCommunityXpNotice({
                communityId,
                xpGained: Math.max(0, pointsAfter - pointsBefore) || 10,
                levelBefore,
                levelAfter,
                reason: 'Topic created successfully.',
            });

            setSuccessMessage('Topic created successfully. Redirecting to the discussion...');
            await router.push(
                `/community/${communityId}/thread/${createdThread.id}/${ensureSlug(createdThread.slug || createdThread.title, 'discussion')}`
            );

        } catch (err) {
            console.error('Create thread error:', err);
            setError(err.message || 'Failed to create topic.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Create Topic - Agent Arena Community</title>
                <meta name="description" content="Create a new community topic" />
            </Head>

            <Navbar />
            <CommunityXpToast communityId={communityId} />

            <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        href={communityId ? `/community/${communityId}` : '/community'}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </Link>

                    <Card className="border-slate-700">
                        <div className="p-8 border-b border-slate-700">
                            <h1 className="text-3xl font-bold text-white mb-2">Create Topic</h1>
                            <p className="text-gray-400">Open a new discussion topic and gather comments in order.</p>
                        </div>

                        <div className="p-8">
                            {successMessage ? (
                                <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                                    {successMessage}
                                </div>
                            ) : null}

                            {error ? (
                                <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                                    {error}
                                </div>
                            ) : null}

                            {loading ? (
                                <p className="text-gray-400">Loading categories...</p>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                        <select
                                            value={selectedCategoryId}
                                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        >
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Topic Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            minLength={3}
                                            maxLength={255}
                                            placeholder="Write a clear topic title"
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Topic Content</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            minLength={10}
                                            maxLength={10000}
                                            rows={8}
                                            placeholder="Describe your topic in detail"
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">{content.length}/10000</p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className={submitting ? 'bg-slate-700 cursor-not-allowed opacity-60 w-full' : 'bg-blue-600 hover:bg-blue-700 w-full'}
                                    >
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <Send size={16} />
                                            {submitting ? 'Publishing Topic...' : 'Publish Topic'}
                                        </span>
                                    </Button>
                                </form>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            <Footer />
        </>
    );
}
