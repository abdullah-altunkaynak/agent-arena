import React, { useState } from 'react';
import { Send, AlertCircle } from 'react-feather';

/**
 * CommentForm Component
 * Reusable comment submission form with validation
 */
export default function CommentForm({
    onSubmit,
    placeholder = "Share your thoughts...",
    maxLength = 5000,
    replyingTo = null,
    onCancelReply = null,
    isLoading = false,
    disabled = false,
    rows = 4,
    showCharacterCount = true,
}) {
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!content.trim()) {
            setError('Comment cannot be empty');
            return;
        }

        if (content.length < 1) {
            setError('Comment is too short');
            return;
        }

        if (content.length > maxLength) {
            setError(`Comment exceeds ${maxLength} character limit`);
            return;
        }

        try {
            setError(null);
            await onSubmit(content.trim());
            setContent(''); // Clear form after submission
        } catch (err) {
            setError(err.message || 'Failed to post comment');
        }
    };

    // Character count indicator color
    const getCountColor = () => {
        const percentage = (content.length / maxLength) * 100;
        if (percentage < 60) return 'text-green-400';
        if (percentage < 80) return 'text-blue-400';
        if (percentage < 100) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Reply To Badge */}
            {replyingTo && (
                <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <p className="text-sm text-blue-300">
                        📌 Replying to: <span className="font-mono text-xs">{replyingTo.substring(0, 8)}</span>
                    </p>
                    {onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="text-gray-400 hover:text-white text-lg"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {/* Textarea */}
            <textarea
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    setError(null);
                }}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={rows}
                disabled={disabled || isLoading}
                className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : ''
                    }`}
            />

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {showCharacterCount && (
                        <p className={`text-xs font-medium ${getCountColor()}`}>
                            {content.length}/{maxLength}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={
                        disabled ||
                        isLoading ||
                        content.length === 0 ||
                        content.length > maxLength
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                >
                    <Send size={16} />
                    {isLoading ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </form>
    );
}
