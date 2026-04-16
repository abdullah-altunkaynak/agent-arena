import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ChevronRight, Users, MessageSquare, Plus, Lock, Share2, Bell } from 'react-feather';

export default function CommunityDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    const [community, setCommunity] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMember, setIsMember] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (id) {
            fetchCommunityDetails();
            fetchCategories();
        }
    }, [id]);

    const fetchCommunityDetails = async () => {
        try {
            const response = await fetch(`/api/community/communities/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Community not found');

            const data = await response.json();
            setCommunity(data);

            // Check if current user is member (simplified - in production use API)
            const token = localStorage.getItem('access_token');
            if (token) {
                setIsMember(true);
            }

            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load community');
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/community/communities/${id}/categories`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data);

            if (data.length > 0) {
                setSelectedCategory(data[0]);
            }
        } catch (err) {
            console.error('Fetch categories error:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCommunity = () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/auth/signin';
        } else {
            // In production, call API to join
            setIsMember(true);
        }
    };

    const handleCreateThread = () => {
        if (!isMember) {
            handleJoinCommunity();
        } else {
            router.push(`/community/${id}/create-thread`);
        }
    };

    if (error && !community) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                    <div className="max-w-6xl mx-auto px-4 text-center">
                        <Card className="bg-red-500/10 border-red-500/20 p-8">
                            <p className="text-red-400 text-lg">{error}</p>
                            <Button onClick={() => router.push('/community')} className="mt-4 bg-red-600 hover:bg-red-700">
                                Back to Communities
                            </Button>
                        </Card>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!community) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Loading community...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>{community.name} - Agent Arena</title>
                <meta name="description" content={community.description || `Join ${community.name} community`} />
                <meta property="og:title" content={community.name} />
                <meta property="og:description" content={community.description} />
                {community.banner_url && <meta property="og:image" content={community.banner_url} />}
                <link rel="canonical" href={`https://agent-arena.com/community/${id}`} />
            </Head>

            <Navbar />

            <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen pb-16">
                {/* Banner */}
                <div
                    className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden"
                    style={
                        community.banner_url
                            ? { backgroundImage: `url(${community.banner_url})`, backgroundSize: 'cover' }
                            : {}
                    }
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                </div>

                {/* Community Header */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row gap-6 -mt-20 mb-12 relative z-10">
                        {/* Icon */}
                        {community.icon_url && (
                            <img
                                src={community.icon_url}
                                alt={community.name}
                                className="w-32 h-32 rounded-xl border-4 border-slate-800 shadow-xl"
                            />
                        )}

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-4xl font-bold text-white">{community.name}</h1>
                                {!community.is_public && (
                                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium flex items-center gap-1">
                                        <Lock size={14} />
                                        Private
                                    </span>
                                )}
                            </div>

                            {community.description && (
                                <p className="text-gray-300 mb-6 text-lg max-w-2xl">{community.description}</p>
                            )}

                            {/* Stats */}
                            <div className="flex gap-8 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Members</p>
                                    <p className="text-2xl font-bold text-white">{community.members_count.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Discussions</p>
                                    <p className="text-2xl font-bold text-white">{community.threads_count}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {isMember ? (
                                    <>
                                        <Button onClick={handleCreateThread} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                                            <Plus size={18} />
                                            Start Discussion
                                        </Button>
                                        <Button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600">
                                            <Bell size={18} />
                                            Watch
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleJoinCommunity} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                                        <Users size={18} />
                                        Join Community
                                    </Button>
                                )}
                                <Button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600">
                                    <Share2 size={18} />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Categories & Threads Section */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Categories Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="border-slate-700">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-white mb-4">Categories</h2>

                                    {loading ? (
                                        <div className="flex justify-center py-6">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No categories available</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {categories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    onClick={() => setSelectedCategory(category)}
                                                    className={`w-full text-left p-3 rounded-lg transition-all ${selectedCategory?.id === category.id
                                                            ? 'bg-blue-600/20 border-l-4 border-blue-500 text-white'
                                                            : 'bg-slate-800/50 text-gray-300 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-semibold">{category.name}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{category.threads_count} threads</p>
                                                        </div>
                                                        {selectedCategory?.id === category.id && (
                                                            <ChevronRight size={16} className="text-blue-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Category Details Card */}
                            {selectedCategory && (
                                <Card className="border-slate-700 mt-4">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            {selectedCategory.icon && (
                                                <span className="text-2xl">{selectedCategory.icon}</span>
                                            )}
                                            <h3 className="font-semibold text-white">{selectedCategory.name}</h3>
                                        </div>
                                        {selectedCategory.description && (
                                            <p className="text-sm text-gray-400 mb-4">{selectedCategory.description}</p>
                                        )}
                                        <Button onClick={handleCreateThread} className="w-full bg-blue-600 hover:bg-blue-700">
                                            New Thread
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Threads List */}
                        <div className="lg:col-span-2">
                            <Card className="border-slate-700">
                                <div className="p-6 border-b border-slate-700">
                                    <h2 className="text-xl font-bold text-white">
                                        {selectedCategory ? `Discussions in ${selectedCategory.name}` : 'Recent Discussions'}
                                    </h2>
                                </div>

                                <div className="divide-y divide-slate-700">
                                    {/* Thread List Placeholder */}
                                    <div className="p-6 text-center">
                                        <MessageSquare size={48} className="mx-auto mb-3 text-gray-500" />
                                        <p className="text-gray-400">No threads yet</p>
                                        {isMember && (
                                            <p className="text-gray-500 text-sm mt-2">Be the first to start a discussion</p>
                                        )}
                                    </div>

                                    {/* In production, threads would be displayed here from API */}
                                    {/* 
                  {threads.map((thread) => (
                    <Link key={thread.id} href={`/community/${id}/thread/${thread.id}`}>
                      <a className="p-6 hover:bg-slate-800/50 transition-colors block">
                        <h3 className="font-bold text-white mb-2 hover:text-blue-400">{thread.title}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{thread.content}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>by {thread.author.username}</span>
                          <div className="flex gap-4">
                            <span>{thread.replies_count} replies</span>
                            <span>{thread.views_count} views</span>
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
                  */}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
