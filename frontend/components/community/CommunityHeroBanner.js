import React from 'react';
import { Users, MessageSquare } from 'lucide-react';

export default function CommunityHeroBanner({ community, topicCount = 0 }) {
    const bannerUrl = community?.banner_url || null;
    const iconUrl = community?.icon_url || null;
    const [iconFailed, setIconFailed] = React.useState(false);

    React.useEffect(() => {
        setIconFailed(false);
    }, [bannerUrl, iconUrl]);

    return (
        <section className="mb-6 overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900/60">
            <div className="relative h-40 sm:h-52 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.35),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,.35),transparent_40%),linear-gradient(135deg,#020617,#0f172a,#111827)]">
                {bannerUrl ? (
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url('${bannerUrl}')` }}
                    />
                ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.35),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,.35),transparent_40%),linear-gradient(135deg,#020617,#0f172a,#111827)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    {iconUrl && !iconFailed ? (
                        <img
                            src={iconUrl}
                            alt=""
                            aria-hidden="true"
                            onError={() => setIconFailed(true)}
                            className="mb-3 h-14 w-14 rounded-xl border border-cyan-300/40 object-cover shadow-lg"
                        />
                    ) : (
                        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-300/30 bg-slate-950/70 text-xs font-bold uppercase tracking-wider text-cyan-100 shadow-lg">
                            {(community?.name || 'Community')
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2)}
                        </div>
                    )}
                    <h1 className="mb-1 text-3xl font-bold text-white sm:text-4xl">
                        {community?.name || 'Community'}
                    </h1>
                    <p className="max-w-3xl text-sm text-slate-200 sm:text-base">
                        {community?.description || 'Community dashboard and discussions.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-200 sm:text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1">
                            <Users size={14} />
                            {(community?.members_count || 0).toLocaleString()} members
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
                            <MessageSquare size={14} />
                            {topicCount} topics
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
