import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import CommunityXpToast from '@/components/community/CommunityXpToast';
import { threadAPI, commentAPI, communityAPI, formatDate } from '@/lib/communityAPI';
import { ensureSlug } from '@/lib/slug';
import { publishCommunityXpNotice } from '@/lib/communityXp';
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    MoreVertical,
    Lock,
    Pin,
    AlertCircle,
    CheckCircle,
    Eye,
} from 'lucide-react';

const buildCommentTree = (flatComments) => {
    const byId = new Map();
    const roots = [];

    flatComments.forEach((rawComment) => {
        byId.set(rawComment.id, {
            ...rawComment,
            replies: [],
        });
    });

    byId.forEach((comment) => {
        if (comment.parent_comment_id && byId.has(comment.parent_comment_id)) {
            byId.get(comment.parent_comment_id).replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
};

const updateCommentTreeLike = (nodes, commentId) => (
    nodes.map((node) => {
        if (node.id === commentId) {
            return {
                ...node,
                likes_count: (node.likes_count || 0) + 1,
            };
        }

        if (!node.replies || node.replies.length === 0) {
            return node;
        }

        return {
            ...node,
            replies: updateCommentTreeLike(node.replies, commentId),
        };
    })
);

const findCommentById = (nodes, commentId) => {
    for (const node of nodes) {
        if (node.id === commentId) {
            return node;
        }

        if (node.replies?.length) {
            const found = findCommentById(node.replies, commentId);
            if (found) return found;
        }
    }

    return null;
};

const normalizeStatusBadges = (author) => {
    if (!Array.isArray(author?.status_badges)) return [];
    return author.status_badges.slice(0, 2);
};

export default function ThreadDetailPage() {
    const router = useRouter();
    const { communityId, threadId } = router.query;

    const [thread, setThread] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likedCommentIds, setLikedCommentIds] = useState([]);

    // Comment submission
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [commentError, setCommentError] = useState(null);
    const [commentSuccess, setCommentSuccess] = useState(false);

    // Pagination
    const [skip, setSkip] = useState(0);
    const [hasMoreComments, setHasMoreComments] = useState(true);

    const getUserFromStorage = () => {
        try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                if (parsedUser?.id || parsedUser?.username || parsedUser?.full_name) {
                    return parsedUser;
                }
            }

            const token = localStorage.getItem('access_token');
            if (!token || token.split('.').length < 2) return null;

            const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(payloadPart)
                    .split('')
                    .map((ch) => `%${(`00${ch.charCodeAt(0).toString(16)}`).slice(-2)}`)
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);

            if (!payload?.username && !payload?.sub) return null;

            return {
                id: payload.sub || payload.user_id || payload.id || payload.username,
                username: payload.username || payload.sub || 'User',
                full_name: payload.full_name || payload.username || payload.sub || 'User',
            };
        } catch {
            return null;
        }
    };

    useEffect(() => {
        setCurrentUser(getUserFromStorage());

        if (threadId) {
            fetchThread();
            fetchComments();
        }
    }, [threadId, skip]);

    const fetchThread = async () => {
        try {
            setLoading(true);
            const data = await threadAPI.getThread(threadId);
            setThread(data);
            setLikeCount(data.likes_count || 0);
            setError(null);
        } catch (err) {
            console.error('Fetch thread error:', err);
            setError('Failed to load thread');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            setCommentsLoading(true);
            const data = await threadAPI.getThreadComments(threadId, skip, 20);
            const incoming = Array.isArray(data) ? data : [];

            if (skip === 0) {
                setComments(buildCommentTree(incoming));
            } else {
                const flatExisting = comments.flatMap(function flatten(comment) {
                    return [
                        { ...comment, replies: undefined },
                        ...(comment.replies || []).flatMap(flatten),
                    ];
                });

                const dedupedById = new Map();
                [...flatExisting, ...incoming].forEach((comment) => {
                    dedupedById.set(comment.id, { ...comment, replies: undefined });
                });

                setComments(buildCommentTree(Array.from(dedupedById.values())));
            }
            setHasMoreComments(incoming.length === 20);
            setError(null);
        } catch (err) {
            console.error('Fetch comments error:', err);
            // Don't show error if comments just fail to load
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleLike = async () => {
        const user = currentUser || getUserFromStorage();
        if (!user) {
            router.push('/auth/signin?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        try {
            await threadAPI.likeThread(threadId);
            setLiked(true);
            setLikeCount(likeCount + 1);
        } catch (err) {
            console.error('Like error:', err);
            if (err.message.includes('Already liked')) {
                setLiked(true);
            }
        }
    };

    const handleCommentLike = async (commentId) => {
        const user = currentUser || getUserFromStorage();
        if (!user) {
            router.push('/auth/signin?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        if (likedCommentIds.includes(commentId)) {
            return;
        }

        try {
            await commentAPI.likeComment(commentId);
            setLikedCommentIds((prev) => [...prev, commentId]);
            setComments((prevComments) => updateCommentTreeLike(prevComments, commentId));
        } catch (err) {
            console.error('Comment like error:', err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            router.push('/auth/signin?redirect=' + encodeURIComponent(router.asPath));
            return;
        }

        if (!newComment.trim() || newComment.length < 1 || newComment.length > 5000) {
            setCommentError('Comment must be between 1 and 5000 characters');
            return;
        }

        try {
            setSubmitting(true);
            setCommentError(null);

            const progressBefore = await communityAPI.getGamificationProgress().catch(() => null);

            await commentAPI.createComment(
                threadId,
                newComment.trim(),
                replyingTo
            );

            setNewComment('');
            setReplyingTo(null);
            setCommentSuccess(true);

            setTimeout(() => setCommentSuccess(false), 3000);

            const progressAfter = await communityAPI.getGamificationProgress().catch(() => null);
            const pointsBefore = Number(progressBefore?.points_total || 0);
            const pointsAfter = Number(progressAfter?.points_total || 0);
            const levelBefore = Number(progressBefore?.level || 1);
            const levelAfter = Number(progressAfter?.level || levelBefore);

            publishCommunityXpNotice({
                communityId,
                xpGained: Math.max(0, pointsAfter - pointsBefore) || 5,
                levelBefore,
                levelAfter,
                reason: 'Comment posted successfully.',
            });

            // Re-fetch list to preserve threaded hierarchy after reply.
            setSkip(0);
            await fetchComments();
            await fetchThread();
        } catch (err) {
            console.error('Submit comment error:', err);
            setCommentError(err.message || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const CommentItem = ({ comment, depth = 0 }) => {
        const isAuthor = currentUser?.id === comment.author.id;
        const parentComment = comment.parent_comment_id ? findCommentById(comments, comment.parent_comment_id) : null;
        const replyTarget = parentComment?.author?.username || parentComment?.author?.full_name || null;
        const clampedDepth = Math.min(depth, 5);

        return (
            <div className={`${depth > 0 ? 'mt-3 pl-4 border-l-2 border-cyan-500/30' : 'border-t border-slate-700 pt-4'}`} style={depth > 0 ? { marginLeft: `${clampedDepth * 12}px` } : undefined}>
                <Card className={`border-slate-700 ${depth > 0 ? 'bg-slate-800/60' : ''}`}>
                    <div className="p-4">
                        {/* Comment Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {comment.author.avatar_url ? (
                                    <img
                                        src={comment.author.avatar_url}
                                        alt={comment.author.username}
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {comment.author.username.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-white">
                                        {comment.author.full_name || comment.author.username}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        @{comment.author.username} • {formatDate(comment.created_at)}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                                            L{comment.author.level || 1}
                                        </span>
                                        {normalizeStatusBadges(comment.author).map((badge) => (
                                            <span key={`${comment.id}-${badge.id || badge.name}`} className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                                                {badge.icon ? `${badge.icon} ` : ''}{badge.name || 'Badge'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {isAuthor && (
                                <button className="text-gray-400 hover:text-white">
                                    <MoreVertical size={16} />
                                </button>
                            )}
                        </div>

                        {replyTarget ? (
                            <p className="mb-2 text-xs text-cyan-300/90">
                                Replying to @{replyTarget}
                            </p>
                        ) : null}

                        {/* Comment Edited Badge */}
                        {comment.is_edited && (
                            <p className="text-xs text-gray-500 mb-2 italic">(edited)</p>
                        )}

                        {/* Comment Content */}
                        <p className="text-gray-200 mb-3 whitespace-pre-wrap">{comment.content}</p>

                        {/* Comment Actions */}
                        <div className="flex gap-4 text-sm">
                            <button
                                type="button"
                                onClick={() => handleCommentLike(comment.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Heart size={16} />
                                <span>{comment.likes_count}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(comment.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                <MessageCircle size={16} />
                                <span>Reply</span>
                            </button>
                        </div>

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 space-y-4">
                                {comment.replies.map((reply) => (
                                    <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    if (error && !thread) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={20} />
                            Back
                        </button>
                        <Card className="bg-red-500/10 border-red-500/20 p-8 text-center">
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

    if (!thread) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Loading thread...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const canonicalThreadSlug = ensureSlug(thread?.slug || thread?.title, 'discussion');

    return (
        <>
            <Head>
                <title>{thread.title} - Agent Arena</title>
                <meta name="description" content={thread.content.substring(0, 150)} />
                <meta property="og:title" content={thread.title} />
                <meta property="og:description" content={thread.content.substring(0, 150)} />
                <link rel="canonical" href={`https://agent-arena.com/community/${communityId}/thread/${threadId}/${canonicalThreadSlug}`} />
            </Head>

            <Navbar />
            <CommunityXpToast communityId={communityId} />

            <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen pb-16 pt-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>

                    {/* Thread Card */}
                    <Card className="border-slate-700 mb-8">
                        <div className="p-8">
                            {/* Title & Badges */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-3">{thread.title}</h1>
                                    <div className="flex gap-3">
                                        {thread.is_pinned && (
                                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                                                <Pin size={12} />
                                                Pinned
                                            </span>
                                        )}
                                        {thread.is_locked && (
                                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-red-500/20 text-red-300">
                                                <Lock size={12} />
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-white">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Author & Meta */}
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                                {thread.author.avatar_url ? (
                                    <img
                                        src={thread.author.avatar_url}
                                        alt={thread.author.username}
                                        className="w-12 h-12 rounded-full"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {thread.author.username.substring(0, 2).toUpperCase()}
                                    </div>
                                )}

                                <div className="flex-1">
                                    <p className="font-semibold text-white">
                                        {thread.author.full_name || thread.author.username}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        @{thread.author.username} • {formatDate(thread.created_at)}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                                            L{thread.author.level || 1}
                                        </span>
                                        {normalizeStatusBadges(thread.author).map((badge) => (
                                            <span key={`thread-${badge.id || badge.name}`} className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                                                {badge.icon ? `${badge.icon} ` : ''}{badge.name || 'Badge'}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-6 text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} className="text-green-400" />
                                        <span>{thread.views_count} views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircle size={16} className="text-blue-400" />
                                        <span>{thread.replies_count} replies</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-8">
                                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t border-slate-700">
                                <Button
                                    onClick={handleLike}
                                    disabled={liked}
                                    className={`flex items-center justify-center gap-2 w-full ${liked
                                        ? 'bg-red-600/20 text-red-400 cursor-default'
                                        : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                                        }`}
                                >
                                    <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                                    <span>{likeCount} Likes</span>
                                </Button>
                            </div>

                            {thread.is_locked && (
                                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                                    <Lock size={20} className="text-yellow-400 flex-shrink-0" />
                                    <p className="text-yellow-300 text-sm">
                                        This discussion is locked. No new comments can be added.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Comments Section */}
                    {!thread.is_locked && (
                        <Card className="border-slate-700 mb-8">
                            <div className="p-8 border-b border-slate-700">
                                <h2 className="text-2xl font-bold text-white">Add Your Comment</h2>
                            </div>

                            <div className="p-8">
                                {commentSuccess && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex gap-3">
                                        <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                                        <p className="text-green-300">Comment posted successfully!</p>
                                    </div>
                                )}

                                {commentError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex gap-3">
                                        <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                                        <p className="text-red-300">{commentError}</p>
                                    </div>
                                )}

                                {!currentUser ? (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 text-center">
                                        <p className="text-blue-200 mb-4">Sign in to add a comment</p>
                                        <Button
                                            onClick={() => router.push('/auth/signin?redirect=' + encodeURIComponent(router.asPath))}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Sign In
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCommentSubmit}>
                                        {replyingTo && (
                                            <div className="mb-4 p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                                                {(() => {
                                                    const parent = findCommentById(comments, replyingTo);
                                                    const replyName = parent?.author?.username || parent?.author?.full_name;
                                                    return (
                                                        <p className="text-sm text-gray-300">
                                                            Replying to {replyName ? `@${replyName}` : 'comment'} <span className="text-blue-400 font-medium">ID: {replyingTo.substring(0, 8)}</span>
                                                        </p>
                                                    );
                                                })()}
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyingTo(null)}
                                                    className="text-gray-400 hover:text-white"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Share your thoughts..."
                                            maxLength="5000"
                                            rows="5"
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                        />

                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-xs text-gray-500">
                                                {newComment.length}/5000 characters
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={submitting || newComment.length < 1 || newComment.length > 5000}
                                                className={
                                                    submitting || newComment.length < 1 || newComment.length > 5000
                                                        ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                }
                                            >
                                                {submitting ? 'Posting...' : 'Post Comment'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Comments List */}
                    <Card className="border-slate-700">
                        <div className="p-8 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white">
                                {thread.replies_count} {thread.replies_count === 1 ? 'Comment' : 'Comments'}
                            </h2>
                        </div>

                        <div className="p-8">
                            {commentsLoading && comments.length === 0 ? (
                                <div className="flex justify-center py-8">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                        <p className="text-gray-400">Loading comments...</p>
                                    </div>
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No comments yet. Be the first to reply!</p>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <CommentItem key={comment.id} comment={comment} />
                                    ))}

                                    {hasMoreComments && (
                                        <div className="flex justify-center mt-8">
                                            <Button
                                                onClick={() => setSkip(skip + 20)}
                                                disabled={commentsLoading}
                                                className="bg-slate-700 hover:bg-slate-600"
                                            >
                                                {commentsLoading ? 'Loading...' : 'Load More Comments'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            <Footer />
        </>
    );
}
