import React from 'react';
import { Trophy, Zap, TrendingUp } from 'lucide-react';

function ProgressBar({ value = 0 }) {
    const normalized = Math.max(0, Math.min(100, Number(value) || 0));

    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all"
                style={{ width: `${normalized}%` }}
            />
        </div>
    );
}

export default function CommunityGamificationPanel({
    progress,
    leaderboard = [],
    loading = false,
    error = null,
    isAuthenticated = false,
}) {
    const pointsInLevel = Number(progress?.points_in_level || 0);
    const pointsToNext = Number(progress?.points_to_next_level || 100);
    const totalInLevel = pointsInLevel + pointsToNext;
    const progressPercent = totalInLevel > 0 ? (pointsInLevel / totalInLevel) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <Zap size={18} className="text-emerald-300" />
                    XP & Level
                </h3>

                {progress ? (
                    <>
                        <div className="mb-3 flex items-end justify-between">
                            <p className="text-2xl font-bold text-white">Level {progress.level}</p>
                            <p className="text-sm text-emerald-200">{progress.points_total} XP</p>
                        </div>

                        <ProgressBar value={progressPercent} />

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                            <span>{pointsInLevel} in level</span>
                            <span>{pointsToNext} to next</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-2">
                                <p className="text-slate-400">Threads</p>
                                <p className="text-base font-semibold text-white">{progress.threads_count || 0}</p>
                            </div>
                            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-2">
                                <p className="text-slate-400">Comments</p>
                                <p className="text-base font-semibold text-white">{progress.comments_count || 0}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-slate-300">Sign in to view your XP progress.</p>
                )}
            </div>

            <div className="rounded-2xl border border-blue-400/20 bg-slate-900/70 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                    <Trophy size={18} className="text-blue-300" />
                    Leaderboard
                </h3>

                {loading ? <p className="text-sm text-slate-400">Loading leaderboard...</p> : null}

                {!loading && leaderboard.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        {isAuthenticated ? 'No ranking data yet.' : 'Sign in to view leaderboard rankings.'}
                    </p>
                ) : null}

                {!loading && leaderboard.length > 0 ? (
                    <ul className="space-y-2">
                        {leaderboard.slice(0, 7).map((item) => (
                            <li key={item.user_id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200">
                                        {item.rank}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.full_name || item.username}</p>
                                        <p className="text-xs text-slate-400">@{item.username}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">L{item.level}</p>
                                    <p className="text-sm font-semibold text-cyan-200">{item.points_total} XP</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}

                <div className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400">
                    <TrendingUp size={12} />
                    Ranking updates as members earn points.
                </div>
            </div>
        </div>
    );
}
