import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Eye, ThumbsUp, Clock } from 'lucide-react';
import { formatDate, truncateText } from '@/lib/communityAPI';

/**
 * ThreadCard Component
 * Compact card display for thread list items
 */
export default function ThreadCard({
    thread,
    communityId,
    onClick,
    showCategory = false,
}) {
    const [hovering, setHovering] = useState(false);

    return (
        <Link
            href={`/community/${communityId}/thread/${thread.id}`}
            as={`/community/${communityId}/thread/${thread.id}`}
        >
            <a
                className="block group"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onClick={onClick}
            >
                <div className={`bg-slate-800/50 rounded-lg p-4 border border-slate-700 transition-all ${hovering
                    ? 'border-blue-500/50 bg-slate-800 shadow-lg shadow-blue-500/10'
                    : ''
                    }`}>

                    {/* Title & Badges */}
                    <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-white group-hover:text-blue-400 transition-colors truncate ${thread.is_pinned ? 'text-lg' : ''
                                }`}>
                                {thread.is_pinned && '📌 '}
                                {thread.title}
                            </h3>
                        </div>
                        {thread.is_locked && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded flex-shrink-0">
                                🔒
                            </span>
                        )}
                    </div>

                    {/* Preview Text */}
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {truncateText(thread.content, 150)}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {thread.author && (
                            <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                    {thread.author.username?.substring(0, 1).toUpperCase()}
                                </div>
                                <span>by {thread.author.username}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-500" />
                            {formatDate(thread.created_at)}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700/50 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <MessageCircle size={14} />
                            <span>{thread.replies_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400">
                            <Eye size={14} />
                            <span>{thread.views_count}</span>
                        </div>
                        {thread.likes_count > 0 && (
                            <div className="flex items-center gap-1.5 text-red-400">
                                <ThumbsUp size={14} />
                                <span>{thread.likes_count}</span>
                            </div>
                        )}
                    </div>
                </div>
            </a>
        </Link>
    );
}
