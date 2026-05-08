import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import {
    COMMUNITY_XP_NOTICE_EVENT,
    consumeCommunityXpNotice,
} from '@/lib/communityXp';

export default function CommunityXpToast({ communityId = null }) {
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        const pendingNotice = consumeCommunityXpNotice(communityId);
        if (pendingNotice) {
            setNotice(pendingNotice);
        }
    }, [communityId]);

    useEffect(() => {
        const handleNotice = (event) => {
            const detail = event.detail || null;
            if (!detail) return;
            if (communityId && detail.communityId && detail.communityId !== communityId) return;
            setNotice(detail);
        };

        window.addEventListener(COMMUNITY_XP_NOTICE_EVENT, handleNotice);
        return () => window.removeEventListener(COMMUNITY_XP_NOTICE_EVENT, handleNotice);
    }, [communityId]);

    useEffect(() => {
        if (!notice) return undefined;
        const timeoutId = window.setTimeout(() => setNotice(null), 3800);
        return () => window.clearTimeout(timeoutId);
    }, [notice]);

    const leveledUp = Boolean(notice && Number(notice.levelAfter || 0) > Number(notice.levelBefore || 0));
    const xpGained = Math.max(0, Number(notice?.xpGained || 0));

    return (
        <AnimatePresence>
            {notice ? (
                <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: -24, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="fixed left-1/2 top-24 z-50 w-[min(92vw,420px)] -translate-x-1/2 pointer-events-none"
                >
                    <div className={`overflow-hidden rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${leveledUp ? 'border-amber-300/40 bg-gradient-to-br from-amber-400/20 via-slate-950/90 to-cyan-500/20' : 'border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 via-slate-950/90 to-blue-500/20'}`}>
                        <div className="absolute inset-0 opacity-40">
                            <div className="absolute -left-6 top-0 h-24 w-24 rounded-full bg-cyan-400/25 blur-3xl" />
                            <div className="absolute -right-2 bottom-0 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl" />
                        </div>

                        <div className="relative flex items-center gap-4">
                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${leveledUp ? 'border-amber-300/50 bg-amber-400/20 text-amber-100' : 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'}`}>
                                {leveledUp ? <Sparkles size={22} /> : <Zap size={22} />}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                                    {leveledUp ? 'Level Up' : 'XP Earned'}
                                </p>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {leveledUp ? `Level ${notice.levelAfter}` : `+${xpGained} XP`}
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                    {notice.reason || (leveledUp ? 'Your progress just jumped.' : 'Your progress was updated.')}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-1 text-right">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${leveledUp ? 'bg-amber-400/20 text-amber-100' : 'bg-cyan-400/15 text-cyan-100'}`}>
                                    {leveledUp ? `L${notice.levelBefore || 1} → L${notice.levelAfter}` : `+${xpGained}`}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Agent Arena</span>
                            </div>
                        </div>

                        {leveledUp ? (
                            <motion.div
                                aria-hidden="true"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.2, opacity: 0.15 }}
                                transition={{ duration: 1.1, repeat: Infinity, repeatType: 'mirror' }}
                                className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-200/30"
                            />
                        ) : null}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
