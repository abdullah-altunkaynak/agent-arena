import React from 'react';
import Link from 'next/link';
import { Users, MessageSquare, TrendingUp } from 'react-feather';

/**
 * CommunityCard Component
 * Card display for community list items
 */
export default function CommunityCard({
    community,
    onClick,
    showDetails = true,
}) {
    return (
        <Link href={`/community/${community.id}`}>
            <a className="block group" onClick={onClick}>
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden group-hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">

                    {/* Banner */}
                    {community.banner_url && (
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
                            <img
                                src={community.banner_url}
                                alt={community.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                    )}
                    <div className={!community.banner_url ? 'h-24 bg-gradient-to-r from-blue-600 to-purple-600' : ''} />

                    {/* Content */}
                    <div className="p-4">
                        {/* Header with Icon and Badge */}
                        <div className="flex items-start justify-between mb-2">
                            {community.icon_url ? (
                                <img
                                    src={community.icon_url}
                                    alt={community.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {community.name.substring(0, 1).toUpperCase()}
                                </div>
                            )}

                            {!community.is_public && (
                                <span className="text-xs font-bold px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                                    Private
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {community.name}
                        </h3>

                        {/* Description */}
                        {community.description && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                {community.description}
                            </p>
                        )}

                        {showDetails && (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-t border-slate-700 pt-3">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-blue-400" />
                                        <div className="text-xs">
                                            <p className="text-gray-500">Members</p>
                                            <p className="font-bold text-white">
                                                {community.members_count.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={14} className="text-green-400" />
                                        <div className="text-xs">
                                            <p className="text-gray-500">Threads</p>
                                            <p className="font-bold text-white">{community.threads_count}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                                    View Community
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </a>
        </Link>
    );
}
