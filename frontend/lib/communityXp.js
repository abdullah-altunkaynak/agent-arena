export const COMMUNITY_XP_NOTICE_EVENT = 'agent-arena:community-xp-notice';
export const COMMUNITY_XP_REFRESH_EVENT = 'agent-arena:community-xp-refresh';
export const COMMUNITY_XP_NOTICE_KEY = 'agent-arena:community-xp-notice';

const isBrowser = () => typeof window !== 'undefined';

export const publishCommunityXpNotice = (payload) => {
    if (!isBrowser()) return payload;

    const notice = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        ...payload,
    };

    try {
        window.localStorage.setItem(COMMUNITY_XP_NOTICE_KEY, JSON.stringify(notice));
    } catch {
        // Ignore storage failures; the event still updates active tabs.
    }

    window.dispatchEvent(new CustomEvent(COMMUNITY_XP_NOTICE_EVENT, { detail: notice }));
    window.dispatchEvent(new CustomEvent(COMMUNITY_XP_REFRESH_EVENT, { detail: notice }));

    return notice;
};

export const consumeCommunityXpNotice = (communityId = null) => {
    if (!isBrowser()) return null;

    try {
        const raw = window.localStorage.getItem(COMMUNITY_XP_NOTICE_KEY);
        if (!raw) return null;

        const notice = JSON.parse(raw);
        if (communityId && notice?.communityId && notice.communityId !== communityId) {
            return null;
        }

        window.localStorage.removeItem(COMMUNITY_XP_NOTICE_KEY);
        return notice;
    } catch {
        return null;
    }
};
