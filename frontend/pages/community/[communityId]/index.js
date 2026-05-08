import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import GlobalCommunitySidebar from '@/components/community/GlobalCommunitySidebar';
import CommunityHeroBanner from '@/components/community/CommunityHeroBanner';
import CommunityRulesPanel from '@/components/community/CommunityRulesPanel';
import CommunityTopicPreviewCard from '@/components/community/CommunityTopicPreviewCard';
import CommunityGamificationPanel from '@/components/community/CommunityGamificationPanel';
import CommunityXpToast from '@/components/community/CommunityXpToast';
import { communityAPI } from '@/lib/communityAPI';
import { publishCommunityXpNotice, COMMUNITY_XP_REFRESH_EVENT } from '@/lib/communityXp';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { ensureSlug } from '@/lib/slug';

function normalizeThread(thread, categories) {
    const category = categories.find((item) => item.id === thread.category_id);
    const commentCount = Number(thread.replies_count ?? thread.comments_count ?? 0);

    return {
        id: thread.id,
        title: (thread.title || 'Untitled discussion').trim(),
        content: (thread.content || thread.summary || '').trim(),
        author: {
            username: thread?.author?.username || thread?.author?.full_name || 'unknown',
            full_name: thread?.author?.full_name || thread?.author?.username || 'unknown',
        },
        category_id: thread.category_id,
        category_name: category?.name || 'General',
        replies_count: Number.isFinite(commentCount) ? commentCount : 0,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
    };
}

export default function CommunityDetailPage() {
    const router = useRouter();
    const { communityId } = router.query;

    const [community, setCommunity] = useState(null);
    const [categories, setCategories] = useState([]);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [gamificationProgress, setGamificationProgress] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [gamificationLoading, setGamificationLoading] = useState(true);
    const [gamificationError, setGamificationError] = useState(null);
    const [rules, setRules] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [categoryFormOpen, setCategoryFormOpen] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryIcon, setCategoryIcon] = useState('');
    const [categoryColor, setCategoryColor] = useState('#22d3ee');
    const [categorySaving, setCategorySaving] = useState(false);
    const previousProgressRef = useRef(null);

    useEffect(() => {
        try {
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                const parsed = JSON.parse(userRaw);
                if (parsed?.id) {
                    setCurrentUserId(parsed.id);
                    return;
                }
            }

            const token = localStorage.getItem('access_token');
            if (!token || token.split('.').length < 2) return;
            const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(payloadPart)
                    .split('')
                    .map((ch) => `%${(`00${ch.charCodeAt(0).toString(16)}`).slice(-2)}`)
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);
            if (payload?.sub) {
                setCurrentUserId(payload.sub);
            }

            const roleFromStorage = localStorage.getItem('user_role');
            if (roleFromStorage) {
                setCurrentUserRole(String(roleFromStorage).toLowerCase());
            }
        } catch {
            setCurrentUserId(null);
        }
    }, []);

    useEffect(() => {
        if (!communityId) return;

        const fetchCommunityDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const [communityRes, categoriesRes, threadsRes] = await Promise.all([
                    fetch(`/api/community/communities/${communityId}`, { headers: { 'Content-Type': 'application/json' } }),
                    fetch(`/api/community/communities/${communityId}/categories`, { headers: { 'Content-Type': 'application/json' } }),
                    fetch(`/api/community/threads/recent?community_id=${communityId}&skip=0&limit=40`, { headers: { 'Content-Type': 'application/json' } }),
                ]);

                if (!communityRes.ok) throw new Error('Failed to load community');
                if (!categoriesRes.ok) throw new Error('Failed to load categories');
                if (!threadsRes.ok) throw new Error('Failed to load topics');

                const [communityData, categoriesData, threadsData] = await Promise.all([
                    communityRes.json(),
                    categoriesRes.json(),
                    threadsRes.json(),
                ]);

                const rulesData = await communityAPI.getCommunityRules(communityId).catch(() => []);

                const filteredThreads = (threadsData || [])
                    .map((thread) => normalizeThread(thread, categoriesData || []))
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

                setCommunity(communityData);
                setCategories(categoriesData || []);
                setThreads(filteredThreads);
                setRules(Array.isArray(rulesData) ? rulesData : []);
            } catch (err) {
                console.error('Community detail error:', err);
                setError(err.message || 'Failed to load community details');
            } finally {
                setLoading(false);
            }
        };

        fetchCommunityDetails();
    }, [communityId]);

    const refreshGamification = useCallback(async ({ announce = true } = {}) => {
        if (!currentUserId) {
            setLeaderboard([]);
            setGamificationProgress(null);
            setGamificationLoading(false);
            setGamificationError(null);
            previousProgressRef.current = null;
            return;
        }

        try {
            setGamificationLoading(true);
            setGamificationError(null);

            const [leaderboardData, progressData] = await Promise.all([
                communityAPI.getGamificationLeaderboard(20).catch(() => []),
                communityAPI.getGamificationProgress().catch(() => null),
            ]);

            setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
            setGamificationProgress(progressData);

            const previousProgress = previousProgressRef.current;
            if (announce && previousProgress && progressData) {
                const previousPoints = Number(previousProgress.points_total || 0);
                const currentPoints = Number(progressData.points_total || 0);
                const previousLevel = Number(previousProgress.level || 1);
                const currentLevel = Number(progressData.level || 1);

                if (currentPoints > previousPoints || currentLevel > previousLevel) {
                    publishCommunityXpNotice({
                        communityId,
                        xpGained: Math.max(0, currentPoints - previousPoints),
                        levelBefore: previousLevel,
                        levelAfter: currentLevel,
                        reason: currentLevel > previousLevel ? 'Level up achieved in the community.' : 'XP updated in the community.',
                    });
                }
            }

            previousProgressRef.current = progressData;
        } catch (err) {
            setLeaderboard([]);
            setGamificationProgress(null);
            setGamificationError(null);
        } finally {
            setGamificationLoading(false);
        }
    }, [communityId, currentUserId]);

    useEffect(() => {
        let intervalId = null;

        if (!currentUserId) {
            setLeaderboard([]);
            setGamificationProgress(null);
            setGamificationLoading(false);
            setGamificationError(null);
            previousProgressRef.current = null;
            return undefined;
        }

        refreshGamification({ announce: false });

        const handleRefresh = () => refreshGamification();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshGamification();
            }
        };

        window.addEventListener(COMMUNITY_XP_REFRESH_EVENT, handleRefresh);
        window.addEventListener('focus', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        intervalId = window.setInterval(() => {
            refreshGamification();
        }, 20000);

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
            window.removeEventListener(COMMUNITY_XP_REFRESH_EVENT, handleRefresh);
            window.removeEventListener('focus', handleVisibilityChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUserId, refreshGamification]);

    const handleSaveAppearance = async (payload) => {
        if (!communityId) return;
        const updated = await communityAPI.updateCommunity(communityId, payload);
        setCommunity(updated);
    };

    const handleCreateCategory = async (event) => {
        event.preventDefault();
        if (!communityId || !categoryName.trim()) return;

        try {
            setCategorySaving(true);
            setError(null);

            await communityAPI.createCategory(
                communityId,
                categoryName.trim(),
                categoryDescription.trim() || null,
                categoryIcon.trim() || null,
                categoryColor || null,
            );

            const refreshed = await communityAPI.getCategories(communityId);
            setCategories(Array.isArray(refreshed) ? refreshed : []);
            setCategoryName('');
            setCategoryDescription('');
            setCategoryIcon('');
            setCategoryFormOpen(false);
        } catch (categoryError) {
            setError(categoryError.message || 'Failed to create category');
        } finally {
            setCategorySaving(false);
        }
    };

    const handleNewTopic = () => {
        if (!categories.length) {
            setCategoryFormOpen(true);
            setError('Before creating a topic, please create at least one category.');
            return;
        }
        router.push(`/community/${communityId}/create-thread?categoryId=${categories[0].id}`);
    };

    const handleAddRule = async (ruleText) => {
        if (!communityId) return;
        const created = await communityAPI.createCommunityRule(communityId, ruleText);
        setRules((prev) => [...prev, created].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
    };

    const handleUpdateRule = async (ruleId, ruleText) => {
        if (!communityId) return;
        const updated = await communityAPI.updateCommunityRule(communityId, ruleId, ruleText);
        setRules((prev) => prev.map((rule) => (rule.id === ruleId ? updated : rule)));
    };

    const handleDeleteRule = async (ruleId) => {
        if (!communityId) return;
        await communityAPI.deleteCommunityRule(communityId, ruleId);
        setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    };

    const canManageCommunity = Boolean(
        currentUserId
        && (
            !community?.owner_id
            || community.owner_id === currentUserId
            || ['admin', 'moderator'].includes(currentUserRole || '')
        )
    );

    return (
        <>
            <Head>
                <title>{community?.name ? `${community.name} - Community` : 'Community'} - Agent Arena</title>
                <meta name="description" content={community?.description || 'Community categories and discussions'} />
                <link
                    rel="canonical"
                    href={community
                        ? `https://agent-arena.com/community/${communityId}/${ensureSlug(community.name, 'community')}`
                        : `https://agent-arena.com/community/${communityId}`}
                />
            </Head>

            <Navbar />
            <GlobalCommunitySidebar activeCommunityId={communityId} />
            <CommunityXpToast communityId={communityId} />

            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 lg:pl-24">
                    <Link href="/community" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                        <ArrowLeft size={18} />
                        Back to Communities
                    </Link>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                            <p className="text-gray-400">Loading community...</p>
                        </div>
                    ) : error ? (
                        <Card className="bg-red-500/10 border-red-500/20 p-6 text-center">
                            <p className="text-red-300 mb-4">{error}</p>
                            <Button onClick={() => router.reload()} className="bg-red-600 hover:bg-red-700">Retry</Button>
                        </Card>
                    ) : (
                        <>
                            <CommunityHeroBanner
                                community={community}
                                topicCount={threads.length || categories.reduce((sum, category) => sum + (category.threads_count || 0), 0)}
                            />

                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                                <section className="space-y-6">
                                    <Card className="border-slate-700 p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-2xl font-semibold text-white">Latest Discussions</h2>
                                                <p className="text-sm text-gray-400">Reddit-style feed view for the selected community.</p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleNewTopic}
                                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400"
                                            >
                                                <Plus size={15} />
                                                New Topic
                                            </button>
                                        </div>
                                    </Card>

                                    {threads.length === 0 ? (
                                        <Card className="border-slate-700 p-10 text-center">
                                            <MessageSquare size={46} className="mx-auto mb-4 text-gray-500" />
                                            <h3 className="text-xl font-semibold text-gray-200 mb-2">No discussions yet</h3>
                                            <p className="text-gray-500">Topics will appear here as card feed once users start posting.</p>
                                        </Card>
                                    ) : (
                                        <div className="space-y-4">
                                            {threads.slice(0, 12).map((thread) => (
                                                <CommunityTopicPreviewCard
                                                    key={thread.id}
                                                    thread={thread}
                                                    communityId={communityId}
                                                    categoryName={thread.category_name}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <Card className="border-slate-700 p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h3 className="text-xl font-semibold text-white">Browse Categories</h3>
                                            {canManageCommunity ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setCategoryFormOpen((prev) => !prev)}
                                                    className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                                                >
                                                    {categoryFormOpen ? 'Close Category Form' : 'Create Category'}
                                                </button>
                                            ) : null}
                                        </div>

                                        {categoryFormOpen && canManageCommunity ? (
                                            <form onSubmit={handleCreateCategory} className="mb-5 grid gap-3 rounded-xl border border-cyan-400/20 bg-slate-900/60 p-3">
                                                <input
                                                    type="text"
                                                    value={categoryName}
                                                    onChange={(event) => setCategoryName(event.target.value)}
                                                    placeholder="Category name"
                                                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={categoryDescription}
                                                    onChange={(event) => setCategoryDescription(event.target.value)}
                                                    placeholder="Category description (optional)"
                                                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={categoryIcon}
                                                        onChange={(event) => setCategoryIcon(event.target.value)}
                                                        placeholder="Icon (optional, e.g. 💬)"
                                                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                                                    />
                                                    <input
                                                        type="color"
                                                        value={categoryColor}
                                                        onChange={(event) => setCategoryColor(event.target.value)}
                                                        className="h-10 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-900 p-1"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={categorySaving}
                                                    className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                                                >
                                                    {categorySaving ? 'Creating...' : 'Save Category'}
                                                </button>
                                            </form>
                                        ) : null}

                                        {categories.length === 0 ? (
                                            <p className="text-sm text-gray-400">This community does not have categories at the moment.</p>
                                        ) : (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {categories.map((category) => (
                                                    <Link
                                                        key={category.id}
                                                        href={`/community/${communityId}/category/${category.id}`}
                                                        className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition-all hover:border-cyan-400/40"
                                                    >
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h4 className="text-base font-semibold text-white">
                                                                {category.icon ? `${category.icon} ` : ''}{category.name}
                                                            </h4>
                                                            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">
                                                                {category.threads_count || 0} topics
                                                            </span>
                                                        </div>
                                                        {category.description ? (
                                                            <p className="text-sm text-gray-400 line-clamp-2">{category.description}</p>
                                                        ) : null}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                </section>

                                <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                                    <CommunityRulesPanel
                                        community={community}
                                        rules={rules}
                                        canEditAppearance={canManageCommunity}
                                        canManageRules={canManageCommunity}
                                        onSaveAppearance={handleSaveAppearance}
                                        onAddRule={handleAddRule}
                                        onUpdateRule={handleUpdateRule}
                                        onDeleteRule={handleDeleteRule}
                                    />
                                    <CommunityGamificationPanel
                                        progress={gamificationProgress}
                                        leaderboard={leaderboard}
                                        loading={gamificationLoading}
                                        error={gamificationError}
                                        isAuthenticated={Boolean(currentUserId)}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
