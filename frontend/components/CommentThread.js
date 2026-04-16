import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Edit2, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/communityAPI';

/**
 * CommentThread Component
 * Displays a comment with nested replies in a thread structure
 */
export default function CommentThread({
    comment,
    currentUser,
    depth = 0,
    onReply,
    onEdit,
    onDelete,
    onLike,
    maxDepth = 2,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [editError, setEditError] = useState(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [likeLoading, setLikeLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const isAuthor = currentUser?.id === comment.author?.id;
    const canEdit = isAuthor;
    const canDelete = isAuthor;
    const canReply = depth < maxDepth;

    const handleEditSave = async () => {
        if (!editedContent.trim()) {
            setEditError('Comment cannot be empty');
            return;
        }

        if (editedContent === comment.content) {
            setIsEditing(false);
            return;
        }

        try {
            setEditSubmitting(true);
            setEditError(null);
            await onEdit(comment.id, editedContent);
            setIsEditing(false);
        } catch (err) {
            setEditError(err.message || 'Failed to edit comment');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            setDeleteLoading(true);
            await onDelete(comment.id);
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete comment');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            setLikeLoading(true);
            await onLike(comment.id);
        } catch (err) {
            console.error('Like error:', err);
        } finally {
            setLikeLoading(false);
        }
    };

    // Indentation based on depth
    const marginLeft = depth > 0 ? `ml-${Math.min(depth * 2, 8)}` : '';

    return (
        <div className={`${marginLeft} ${depth > 0 ? 'border-l-2 border-slate-700 pl-4 mt-4' : 'border-t border-slate-700 pt-4'}`}>
            <div className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                        {comment.author?.avatar_url ? (
                            <img
                                src={comment.author.avatar_url}
                                alt={comment.author.username}
                                className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {comment.author?.username?.substring(0, 2).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white">
                                    {comment.author?.full_name || comment.author?.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                    @{comment.author?.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                        {canEdit && (
                            <button
                                onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                title="Edit"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit Mode */}
                {isEditing ? (
                    <div className="space-y-3 mb-3">
                        <textarea
                            value={editedContent}
                            onChange={(e) => {
                                setEditedContent(e.target.value);
                                setEditError(null);
                            }}
                            maxLength="5000"
                            rows="4"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                        {editError && <p className="text-sm text-red-400">{editError}</p>}
                        <div className="flex gap-2">
                            <button
                                onClick={handleEditSave}
                                disabled={editSubmitting}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm rounded flex items-center gap-1"
                            >
                                <Check size={14} />
                                {editSubmitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedContent(comment.content);
                                    setEditError(null);
                                }}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Comment Content */}
                        <p className="text-gray-200 mb-3 whitespace-pre-wrap text-sm">{comment.content}</p>

                        {comment.is_edited && (
                            <p className="text-xs text-gray-500 italic mb-3">(edited)</p>
                        )}
                    </>
                )}

                {/* Comment Actions */}
                {!isEditing && (
                    <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                        <button
                            onClick={handleLike}
                            disabled={likeLoading}
                            className="flex items-center gap-1 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            <Heart size={14} />
                            <span>{comment.likes_count}</span>
                        </button>

                        {canReply && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                            >
                                <MessageCircle size={14} />
                                <span>Reply</span>
                            </button>
                        )}

                        {comment.replies_count > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                            >
                                {showReplies ? '▼' : '▶'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>
                )}

                {/* Nested Replies */}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-3 mt-4">
                        {comment.replies.map((reply) => (
                            <CommentThread
                                key={reply.id}
                                comment={reply}
                                currentUser={currentUser}
                                depth={depth + 1}
                                onReply={onReply}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onLike={onLike}
                                maxDepth={maxDepth}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
