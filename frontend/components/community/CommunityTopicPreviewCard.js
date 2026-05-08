import React from 'react';
import Link from 'next/link';
import { MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDate, truncateText } from '@/lib/communityAPI';
import { ensureSlug } from '@/lib/slug';

export default function CommunityTopicPreviewCard({ thread, communityId, categoryName }) {
    const commentCount = Number(thread?.replies_count ?? 0);
    const commentLabel = commentCount === 1 ? 'comment' : 'comments';
    const authorName = thread?.author?.full_name || thread?.author?.username || 'unknown';
    const excerpt = truncateText(thread?.content || '', 180) || 'No summary yet.';
    const threadSlug = ensureSlug(thread?.slug || thread?.title, 'discussion');

    return (
        <Link
            href={`/community/${communityId}/thread/${thread.id}/${threadSlug}`}
            className="group block rounded-xl border border-slate-700 bg-slate-900/70 p-5 transition-all hover:border-cyan-400/40 hover:bg-slate-900"
        >
            <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-cyan-300">
                    {thread.title || 'Untitled discussion'}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
                    <MessageCircle size={12} />
                    {commentCount} {commentLabel}
                </span>
            </div>

            <p className="mb-4 text-sm text-slate-300">
                {excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1">
                        {categoryName || 'General'}
                    </span>
                    <span>by {authorName}</span>
                    <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {thread?.created_at ? formatDate(thread.created_at) : 'recently'}
                    </span>
                </div>

                <span className="inline-flex items-center gap-1 text-cyan-300 group-hover:text-cyan-200">
                    Open
                    <ArrowRight size={12} />
                </span>
            </div>
        </Link>
    );
}
