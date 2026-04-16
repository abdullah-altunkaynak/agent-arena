import React, { useState } from 'react';
import { Menu, Trash2, Lock, Pin, AlertTriangle } from 'react-feather';
import { threadModerationAPI, commentModerationAPI, warningAPI } from '@/lib/moderationAPI';
import Button from '@/components/Button';

/**
 * ModerationMenu Component
 * Dropdown menu for moderators to moderate content
 */
export default function ModerationMenu({
    contentType = 'thread', // 'thread' or 'comment'
    contentId,
    authorId,
    isPinned = false,
    isLocked = false,
    onActionComplete = null,
    canModerate = false, // Check if user is moderator
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showReasonInput, setShowReasonInput] = useState(null);
    const [reason, setReason] = useState('');

    if (!canModerate) return null;

    const handleAction = async (action) => {
        try {
            setLoading(true);
            setError(null);

            if (contentType === 'thread') {
                switch (action) {
                    case 'pin':
                        await threadModerationAPI.pinThread(contentId, reason);
                        break;
                    case 'unpin':
                        await threadModerationAPI.unpinThread(contentId);
                        break;
                    case 'lock':
                        await threadModerationAPI.lockThread(contentId, reason);
                        break;
                    case 'unlock':
                        await threadModerationAPI.unlockThread(contentId);
                        break;
                    case 'delete':
                        if (window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
                            await threadModerationAPI.deleteThread(contentId, reason);
                        }
                        break;
                    case 'warn':
                        if (reason) {
                            await warningAPI.warnUser(authorId, reason, 'low');
                        }
                        break;
                    default:
                        break;
                }
            } else if (contentType === 'comment') {
                switch (action) {
                    case 'delete':
                        if (window.confirm('Are you sure you want to delete this comment?')) {
                            await commentModerationAPI.deleteComment(contentId, reason);
                        }
                        break;
                    case 'warn':
                        if (reason) {
                            await warningAPI.warnUser(authorId, reason, 'low');
                        }
                        break;
                    default:
                        break;
                }
            }

            setIsOpen(false);
            setShowReasonInput(null);
            setReason('');

            if (onActionComplete) {
                onActionComplete(action);
            }
        } catch (err) {
            console.error('Action error:', err);
            setError(err.message || 'Failed to execute action');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-slate-700 rounded transition-colors text-gray-400 hover:text-white"
            >
                <Menu size={18} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-500/10 border-b border-red-500/20 p-3 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="divide-y divide-slate-700">
                        {/* Reason Input (if showing) */}
                        {showReasonInput && (
                            <div className="p-3 space-y-2">
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={`Reason for ${showReasonInput}...`}
                                    maxLength="500"
                                    rows="3"
                                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAction(showReasonInput)}
                                        disabled={loading || !reason}
                                        className={`flex-1 text-xs ${loading || !reason
                                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        Confirm
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowReasonInput(null);
                                            setReason('');
                                        }}
                                        className="flex-1 text-xs bg-slate-700 hover:bg-slate-600"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Thread-specific Actions */}
                        {contentType === 'thread' && (
                            <>
                                <button
                                    onClick={() => (isPinned ? handleAction('unpin') : setShowReasonInput('pin'))}
                                    disabled={loading}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <Pin size={16} className={isPinned ? 'text-yellow-400' : ''} />
                                    {isPinned ? 'Unpin Thread' : 'Pin Thread'}
                                </button>

                                <button
                                    onClick={() => (isLocked ? handleAction('unlock') : setShowReasonInput('lock'))}
                                    disabled={loading}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <Lock size={16} className={isLocked ? 'text-red-400' : ''} />
                                    {isLocked ? 'Unlock Thread' : 'Lock Thread'}
                                </button>

                                <button
                                    onClick={() => setShowReasonInput('delete')}
                                    disabled={loading}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete Thread
                                </button>
                            </>
                        )}

                        {/* Comment-specific Actions */}
                        {contentType === 'comment' && (
                            <button
                                onClick={() => setShowReasonInput('delete')}
                                disabled={loading}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete Comment
                            </button>
                        )}

                        {/* User Warning */}
                        <button
                            onClick={() => setShowReasonInput('warn')}
                            disabled={loading}
                            className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <AlertTriangle size={16} />
                            Issue Warning
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
