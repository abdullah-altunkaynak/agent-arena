import React, { useState } from 'react';
import { AlertCircle, Flag, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { reportAPI } from '@/lib/moderationAPI';

/**
 * ReportModal Component
 * Modal for reporting threads, comments, or users
 */
export default function ReportModal({
    isOpen,
    onClose,
    targetId,
    targetType = 'thread', // 'thread', 'comment', 'user'
    targetTitle = null,
}) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const reasons = [
        { value: 'spam', label: '🚫 Spam or advertising' },
        { value: 'hate', label: '❌ Hate speech or harassment' },
        { value: 'harmful', label: '⚠️ Harmful or dangerous content' },
        { value: 'misleading', label: '🤥 Misinformation' },
        { value: 'copyright', label: '©️ Copyright infringement' },
        { value: 'off_topic', label: '📍 Off-topic content' },
        { value: 'other', label: '❓ Other' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason) {
            setError('Please select a reason');
            return;
        }

        if (description && description.length < 10) {
            setError('Description must be at least 10 characters');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await reportAPI.createReport(
                targetType,
                targetId,
                reason,
                description || null
            );

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setReason('');
                setDescription('');
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Report error:', err);
            setError(err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="border-slate-700 max-w-md w-full">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <Flag size={24} className="text-red-400" />
                        <h2 className="text-2xl font-bold text-white">Report {targetType}</h2>
                    </div>

                    {targetTitle && (
                        <p className="text-sm text-gray-400 mb-6 bg-slate-800/50 p-3 rounded line-clamp-2">
                            "{targetTitle}"
                        </p>
                    )}

                    {success ? (
                        <div className="text-center py-6">
                            <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
                            <h3 className="text-lg font-semibold text-green-300 mb-1">Report Submitted</h3>
                            <p className="text-sm text-gray-400">
                                Thank you. Our moderation team will review this.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2">
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Reason Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Reason <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select a reason...</option>
                                    {reasons.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Additional Details (optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide more context..."
                                    maxLength="2000"
                                    rows="4"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                                {description && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {description.length}/2000 characters
                                    </p>
                                )}
                            </div>

                            {/* Privacy Notice */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-xs text-blue-300">
                                    💡 Your report is anonymous and will be reviewed by our moderation team.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading || !reason}
                                    className={`flex-1 ${loading || !reason
                                        ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {loading ? 'Submitting...' : 'Submit Report'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
}
