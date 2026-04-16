/**
 * Moderation API Client - Frontend utilities for moderation API calls
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

// Report endpoints
export const reportAPI = {
    /**
     * Create a report for thread, comment, or user
     */
    createReport: (type, targetId, reason, description = null) =>
        apiCall('/api/moderation/reports', {
            method: 'POST',
            body: JSON.stringify({
                type,
                target_id: targetId,
                reason,
                description,
            }),
        }),

    /**
     * List reports (moderator+ only)
     */
    listReports: (statusFilter = null, skip = 0, limit = 10) => {
        let url = `/api/moderation/reports?skip=${skip}&limit=${limit}`;
        if (statusFilter) url += `&status_filter=${statusFilter}`;
        return apiCall(url);
    },

    /**
     * Update report status (moderator+ only)
     */
    updateReportStatus: (reportId, newStatus) =>
        apiCall(`/api/moderation/reports/${reportId}?new_status=${newStatus}`, {
            method: 'PUT',
        }),
};

// Thread moderation endpoints
export const threadModerationAPI = {
    /**
     * Pin a thread (moderator+ only)
     */
    pinThread: (threadId, reason = null) => {
        let url = `/api/moderation/threads/${threadId}/pin`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        return apiCall(url, { method: 'POST' });
    },

    /**
     * Unpin a thread (moderator+ only)
     */
    unpinThread: (threadId) =>
        apiCall(`/api/moderation/threads/${threadId}/unpin`, { method: 'POST' }),

    /**
     * Lock a thread (moderator+ only)
     */
    lockThread: (threadId, reason = null) => {
        let url = `/api/moderation/threads/${threadId}/lock`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        return apiCall(url, { method: 'POST' });
    },

    /**
     * Unlock a thread (moderator+ only)
     */
    unlockThread: (threadId) =>
        apiCall(`/api/moderation/threads/${threadId}/unlock`, { method: 'POST' }),

    /**
     * Delete a thread (moderator+ only)
     */
    deleteThread: (threadId, reason = null) => {
        let url = `/api/moderation/threads/${threadId}`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        return apiCall(url, { method: 'DELETE' });
    },
};

// Comment moderation endpoints
export const commentModerationAPI = {
    /**
     * Delete a comment (moderator+ only)
     */
    deleteComment: (commentId, reason = null) => {
        let url = `/api/moderation/comments/${commentId}`;
        if (reason) url += `?reason=${encodeURIComponent(reason)}`;
        return apiCall(url, { method: 'DELETE' });
    },
};

// User warning endpoints
export const warningAPI = {
    /**
     * Issue a warning to a user (moderator+ only)
     */
    warnUser: (userId, reason, severity = 'low') =>
        apiCall(`/api/moderation/users/${userId}/warn?reason=${encodeURIComponent(reason)}&severity=${severity}`, {
            method: 'POST',
        }),

    /**
     * Get warnings for a user
     */
    getUserWarnings: (userId) =>
        apiCall(`/api/moderation/users/${userId}/warnings`),
};
