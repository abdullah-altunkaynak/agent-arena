/**
 * Community API Client - Frontend utilities for API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Helper to get auth header
const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper for fetch with error handling
const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
};

// Community endpoints
export const communityAPI = {
    /**
     * Get list of communities
     */
    listCommunities: (skip = 0, limit = 10, isPublic = true) =>
        apiCall(
            `/api/community/communities?skip=${skip}&limit=${limit}&is_public=${isPublic}`
        ),

    /**
     * Get community details
     */
    getCommunity: (communityId) =>
        apiCall(`/api/community/communities/${communityId}`),

    /**
     * Get categories in a community
     */
    getCategories: (communityId) =>
        apiCall(`/api/community/communities/${communityId}/categories`),

    /**
     * Create a new community (admin only)
     */
    createCommunity: (name, description, isPublic = true) =>
        apiCall('/api/community/communities', {
            method: 'POST',
            body: JSON.stringify({ name, description, is_public: isPublic }),
        }),

    /**
     * Create a category in a community (moderator+)
     */
    createCategory: (communityId, name, description, icon, color) =>
        apiCall(`/api/community/communities/${communityId}/categories`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description,
                icon,
                color,
            }),
        }),
};

// Thread endpoints
export const threadAPI = {
    /**
     * Create a new thread
     */
    createThread: (title, content, categoryId) =>
        apiCall('/api/threads', {
            method: 'POST',
            body: JSON.stringify({
                title,
                content,
                category_id: categoryId,
            }),
        }),

    /**
     * Get thread details
     */
    getThread: (threadId) =>
        apiCall(`/api/threads/${threadId}`),

    /**
     * Get comments on a thread
     */
    getThreadComments: (threadId, skip = 0, limit = 20) =>
        apiCall(
            `/api/threads/${threadId}/comments?skip=${skip}&limit=${limit}`
        ),

    /**
     * Update thread (owner/moderator only)
     */
    updateThread: (threadId, title, content, isPinned, isLocked) =>
        apiCall(`/api/threads/${threadId}`, {
            method: 'PUT',
            body: JSON.stringify({
                title,
                content,
                is_pinned: isPinned,
                is_locked: isLocked,
            }),
        }),

    /**
     * Delete thread (owner/moderator only)
     */
    deleteThread: (threadId) =>
        apiCall(`/api/threads/${threadId}`, {
            method: 'DELETE',
        }),

    /**
     * Like a thread
     */
    likeThread: (threadId) =>
        apiCall(`/api/threads/${threadId}/like`, {
            method: 'POST',
        }),

    /**
     * Get trending threads
     */
    getTrendingThreads: (skip = 0, limit = 10) =>
        apiCall(
            `/api/community/threads/trending?skip=${skip}&limit=${limit}`
        ),

    /**
     * Get recent threads
     */
    getRecentThreads: (skip = 0, limit = 10) =>
        apiCall(
            `/api/community/threads/recent?skip=${skip}&limit=${limit}`
        ),
};

// Comment endpoints
export const commentAPI = {
    /**
     * Create a comment on a thread
     */
    createComment: (threadId, content, parentCommentId = null) =>
        apiCall(`/api/comments?thread_id=${threadId}`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                parent_comment_id: parentCommentId,
            }),
        }),

    /**
     * Get comment with nested replies
     */
    getComment: (commentId) =>
        apiCall(`/api/comments/${commentId}`),

    /**
     * Update comment (owner/moderator only)
     */
    updateComment: (commentId, content) =>
        apiCall(`/api/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        }),

    /**
     * Delete comment (owner/moderator only)
     */
    deleteComment: (commentId) =>
        apiCall(`/api/comments/${commentId}`, {
            method: 'DELETE',
        }),

    /**
     * Like a comment
     */
    likeComment: (commentId) =>
        apiCall(`/api/comments/${commentId}/like`, {
            method: 'POST',
        }),

    /**
     * Unlike a comment
     */
    unlikeComment: (commentId) =>
        apiCall(`/api/comments/${commentId}/like`, {
            method: 'DELETE',
        }),
};

// Utility functions
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2592000000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString();
};

export const truncateText = (text, length = 200) => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
};

export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
