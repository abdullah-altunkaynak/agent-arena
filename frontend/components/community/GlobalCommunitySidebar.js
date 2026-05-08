import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Home, Plus, Users } from 'lucide-react';
import { ensureSlug } from '@/lib/slug';

function getInitials(name) {
    if (!name) return 'AA';
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export default function GlobalCommunitySidebar({ activeCommunityId = null }) {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchCommunities = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/community/communities?skip=0&limit=30&is_public=true', {
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch communities for sidebar');
                }

                const data = await response.json();
                if (!cancelled) {
                    setCommunities(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('GlobalCommunitySidebar error:', error);
                if (!cancelled) {
                    setCommunities([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchCommunities();

        return () => {
            cancelled = true;
        };
    }, []);

    const displayCommunities = useMemo(() => communities.slice(0, 12), [communities]);

    return (
        <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-20 z-40 border-r border-cyan-400/10 bg-slate-950/80 backdrop-blur-xl flex-col items-center py-4 gap-3">
            <Link
                href="/community"
                className="w-12 h-12 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center justify-center"
                title="Community Home"
            >
                <Home size={18} />
            </Link>

            <div className="w-8 h-px bg-slate-700" />

            {loading ? (
                <div className="text-[10px] text-slate-500 text-center px-1 leading-tight">Loading</div>
            ) : displayCommunities.length === 0 ? (
                <div className="text-[10px] text-slate-500 text-center px-1 leading-tight">No hubs</div>
            ) : (
                <div className="flex flex-col items-center gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/40 pr-1">
                    {displayCommunities.map((community) => {
                        const isActive = activeCommunityId === community.id;
                        const communitySlug = ensureSlug(community.name, 'community');

                        return (
                            <Link
                                key={community.id}
                                href={`/community/${community.id}/${communitySlug}`}
                                title={community.name}
                                className={`relative w-12 h-12 rounded-2xl overflow-hidden transition-all flex items-center justify-center ${isActive
                                    ? 'ring-2 ring-cyan-300 bg-cyan-500/20'
                                    : 'border border-slate-700 bg-slate-900/80 hover:bg-slate-800'
                                    }`}
                            >
                                {community.icon_url ? (
                                    <img
                                        src={community.icon_url}
                                        alt={community.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-semibold text-cyan-200">
                                        {getInitials(community.name)}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="mt-auto flex flex-col items-center gap-2">
                <Link
                    href="/community"
                    title="Explore communities"
                    className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all flex items-center justify-center"
                >
                    <Users size={16} />
                </Link>
                <button
                    type="button"
                    title="Create community (coming soon)"
                    className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all flex items-center justify-center"
                    onClick={() => window.alert('Create community will be enabled in the next step.')}
                >
                    <Plus size={16} />
                </button>
            </div>
        </aside>
    );
}
