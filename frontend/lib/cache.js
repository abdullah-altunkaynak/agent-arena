/**
 * Simple In-Memory Cache for Blog API Responses
 * Reduces database load and improves TTFB
 */

const cache = new Map();

export function setCacheHeaders(res, maxAge = 300) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 4}`);
}

export function getCachedResponse(key) {
    if (!cache.has(key)) return null;

    const { value, timestamp, ttl } = cache.get(key);

    // Check if cache expired
    if (Date.now() - timestamp > ttl) {
        cache.delete(key);
        return null;
    }

    return value;
}

export function setCachedResponse(key, value, ttl = 300000) {
    // Cache for 5 minutes by default
    cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl,
    });
}

export function invalidateCache(pattern) {
    // Invalidate all cache entries matching pattern
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
}

export function getCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});

    return `${endpoint}:${JSON.stringify(sortedParams)}`;
}
