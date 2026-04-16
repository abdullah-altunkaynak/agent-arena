import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Search, Plus, Users, MessageSquare, TrendingUp } from 'react-feather';

export default function CommunitiesPage() {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        fetchCommunities();
    }, [skip, isPublic]);

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                skip: skip,
                limit: 10,
                is_public: isPublic,
            });

            const response = await fetch(`/api/community/communities?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch communities');

            const data = await response.json();
            if (skip === 0) {
                setCommunities(data);
            } else {
                setCommunities([...communities, ...data]);
            }

            setHasMore(data.length === 10);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load communities');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredCommunities = communities.filter((community) =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.description && community.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const loadMore = () => {
        setSkip(skip + 10);
    };

    const handleCreateCommunity = () => {
        // Check auth
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/auth/signin';
        } else {
            // In production, this would be an admin-only modal
            alert('Community creation coming soon - admin only feature');
        }
    };

    return (
        <>
            <Head>
                <title>Communities - Agent Arena</title>
                <meta name="description" content="Join and participate in Agent Arena communities" />
                <meta property="og:title" content="Communities - Agent Arena" />
                <meta property="og:description" content="Join communities and engage in discussions" />
                <link rel="canonical" href="https://agent-arena.com/community" />
            </Head>

            <Navbar />

            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                {/* Header */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Communities</h1>
                            <p className="text-gray-400">Explore and join communities</p>
                        </div>
                        <Button
                            onClick={handleCreateCommunity}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Create Community
                        </Button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-slate-700">
                        <button
                            onClick={() => {
                                setIsPublic(true);
                                setSkip(0);
                            }}
                            className={`pb-3 px-4 font-medium transition-colors ${isPublic
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Public Communities
                        </button>
                        <button
                            onClick={() => {
                                setIsPublic(false);
                                setSkip(0);
                            }}
                            className={`pb-3 px-4 font-medium transition-colors ${!isPublic
                                    ? 'text-blue-400 border-b-2 border-blue-400'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Private Communities
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-3 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Communities Grid */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading && skip === 0 ? (
                        <div className="flex items-center justify-center min-h-96">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-400">Loading communities...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <Card className="bg-red-500/10 border-red-500/20 p-6 text-center">
                            <p className="text-red-400">{error}</p>
                            <Button onClick={() => setSkip(0)} className="mt-4 bg-red-600 hover:bg-red-700">
                                Retry
                            </Button>
                        </Card>
                    ) : filteredCommunities.length === 0 ? (
                        <Card className="p-12 text-center border-slate-700">
                            <MessageSquare size={48} className="mx-auto mb-4 text-gray-500" />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">No communities found</h3>
                            <p className="text-gray-500">
                                {searchQuery ? 'Try a different search query' : 'Be the first to create a community!'}
                            </p>
                        </Card>
                    ) : (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredCommunities.map((community) => (
                                    <Link key={community.id} href={`/community/${community.id}`}>
                                        <a>
                                            <Card className="h-full hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 group">
                                                {/* Banner */}
                                                {community.banner_url && (
                                                    <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg mb-4 overflow-hidden">
                                                        <img
                                                            src={community.banner_url}
                                                            alt={community.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="p-4">
                                                    {/* Icon + Badge */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        {community.icon_url && (
                                                            <img
                                                                src={community.icon_url}
                                                                alt={community.name}
                                                                className="w-12 h-12 rounded-lg"
                                                            />
                                                        )}
                                                        {!community.is_public && (
                                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                                                                Private
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Name & Description */}
                                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                        {community.name}
                                                    </h3>
                                                    {community.description && (
                                                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                                            {community.description}
                                                        </p>
                                                    )}

                                                    {/* Stats */}
                                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <Users size={16} className="text-blue-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Members</p>
                                                                <p className="font-semibold text-white">
                                                                    {community.members_count.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare size={16} className="text-green-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Threads</p>
                                                                <p className="font-semibold text-white">
                                                                    {community.threads_count}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer CTA */}
                                                <div className="px-4 pb-4">
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                                                        View Community
                                                    </Button>
                                                </div>
                                            </Card>
                                        </a>
                                    </Link>
                                ))}
                            </div>

                            {/* Load More */}
                            {hasMore && (
                                <div className="flex justify-center mt-12">
                                    <Button
                                        onClick={loadMore}
                                        disabled={loading}
                                        className="px-8 bg-slate-700 hover:bg-slate-600"
                                    >
                                        {loading ? 'Loading...' : 'Load More Communities'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
