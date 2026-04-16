import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Plus, MessageSquare, Eye, Heart, ArrowUp, Clock } from 'lucide-react';

export default function CategoryThreadsPage() {
    const router = useRouter();
    const { communityId, categoryId } = router.query;

    const [threads, setThreads] = useState([]);
    const [category, setCategory] = useState(null);
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (communityId && categoryId) {
            fetchCommunityData();
            fetchCategoryData();
            fetchThreads();
        }
    }, [communityId, categoryId, sortBy, skip]);

    const fetchCommunityData = async () => {
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

    const fetchCategoryData = async () => {
        try {
            const response = await fetch(`/api/community/communities/${communityId}/categories`, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                const cat = data.find((c) => c.id === categoryId);
                setCategory(cat);
            }
        } catch (err) {
            console.error('Failed to fetch category:', err);
        }
    };

    const fetchThreads = async () => {
        try {
            setLoading(true);
            let endpoint = '/api/community/threads/recent';

            if (sortBy === 'trending') {
                endpoint = '/api/community/threads/trending';
            }

            const params = new URLSearchParams({
                skip: skip,
                limit: 15,
            });

            const response = await fetch(`${endpoint}?${params}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to fetch threads');

            const data = await response.json();

            // Filter by category if needed
            const filteredThreads = data.filter((t) => t.category_id === categoryId);

            if (skip === 0) {
                setThreads(filteredThreads);
            } else {
                setThreads([...threads, ...filteredThreads]);
            }

            setHasMore(data.length === 15);
            setError(null);
        } catch (err) {
            console.error('Fetch threads error:', err);
            setError('Failed to load threads');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/auth/signin';
        } else {
            router.push(`/community/${communityId}/create-thread?categoryId=${categoryId}`);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!category) {
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
                <title>
                    {category.name} - {community?.name || 'Community'} - Agent Arena
                </title>
                <meta
                    name="description"
                    content={`Discussions about ${category.name}${community ? ` in ${community.name}` : ''}`}
                />
                <link
                    rel="canonical"
                    href={`https://agent-arena.com/community/${communityId}/categories/${categoryId}`}
                />
            </Head>

            <Navbar />

            <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen pb-16 pt-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-8 text-sm text-gray-400">
                        <Link href="/community">
                            <a className="hover:text-white transition-colors">Communities</a>
                        </Link>
                        <span>/</span>
                        <Link href={`/community/${communityId}`}>
                            <a className="hover:text-white transition-colors">{community?.name}</a>
                        </Link>
                        <span>/</span>
                        <span className="text-white font-medium">{category.name}</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    {category.icon && <span className="text-3xl">{category.icon}</span>}
                                    {category.name}
                                </h1>
                                {category.description && (
                                    <p className="text-gray-400">{category.description}</p>
                                )}
                            </div>
                            <Button
                                onClick={handleCreateThread}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus size={20} />
                                New Discussion
                            </Button>
                        </div>

                        {/* Sort Controls */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setSortBy('recent');
                                    setSkip(0);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${sortBy === 'recent'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-gray-300 hover:text-white'
                                    }`}
                            >
                                <Clock size={16} className="inline mr-2" />
                                Recent
                            </button>
                            <button
                                onClick={() => {
                                    setSortBy('trending');
                                    setSkip(0);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${sortBy === 'trending'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-gray-300 hover:text-white'
                                    }`}
                            >
                                <ArrowUp size={16} className="inline mr-2" />
                                Trending
                            </button>
                        </div>
                    </div>

                    {/* Threads List */}
                    <div className="space-y-3">
                        {error ? (
                            <Card className="bg-red-500/10 border-red-500/20 p-6 text-center">
                                <p className="text-red-400">{error}</p>
                                <Button onClick={() => setSkip(0)} className="mt-4 bg-red-600 hover:bg-red-700">
                                    Retry
                                </Button>
                            </Card>
                        ) : loading && skip === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                                    <p className="text-gray-400">Loading discussions...</p>
                                </div>
                            </div>
                        ) : threads.length === 0 ? (
                            <Card className="border-slate-700 p-12 text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 text-gray-500" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No discussions yet</h3>
                                <p className="text-gray-500 mb-6">Be the first to start a discussion in this category</p>
                                <Button
                                    onClick={handleCreateThread}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Start Discussion
                                </Button>
                            </Card>
                        ) : (
                            <>
                                {threads.map((thread) => (
                                    <Link key={thread.id} href={`/community/${communityId}/thread/${thread.id}`}>
                                        <a>
                                            <Card className="border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group p-4">
                                                <div className="flex gap-4">
                                                    {/* Thread Content */}
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                                {thread.title}
                                                            </h2>
                                                            {thread.is_pinned && (
                                                                <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                                                                    Pinned
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{thread.content}</p>

                                                        {/* Thread Meta */}
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span>by {thread.author.username}</span>
                                                            <span>{formatDate(thread.created_at)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="flex flex-col gap-2 text-right">
                                                        <div className="flex items-center gap-2 justify-end text-gray-400">
                                                            <MessageSquare size={16} className="text-cyan-400" />
                                                            <span className="font-semibold text-white">{thread.replies_count}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-end text-gray-400">
                                                            <Eye size={16} className="text-green-400" />
                                                            <span className="font-semibold text-white">{thread.views_count}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-end text-gray-400">
                                                            <Heart size={16} className="text-red-400" />
                                                            <span className="font-semibold text-white">{thread.likes_count}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {thread.is_locked && (
                                                    <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-yellow-400">
                                                        🔒 This discussion is locked
                                                    </div>
                                                )}
                                            </Card>
                                        </a>
                                    </Link>
                                ))}

                                {/* Load More */}
                                {hasMore && (
                                    <div className="flex justify-center mt-8">
                                        <Button
                                            onClick={() => setSkip(skip + 15)}
                                            disabled={loading}
                                            className="px-8 bg-slate-700 hover:bg-slate-600"
                                        >
                                            {loading ? 'Loading...' : 'Load More Discussions'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
