const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me';

function logSitemap(message, details) {
    if (typeof details === 'undefined') {
        console.log(`[sitemap] ${message}`);
        return;
    }

    console.log(`[sitemap] ${message}`, details);
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildUrlEntry(loc, lastmod, priority = '0.7', changefreq = 'weekly') {
    const safeLoc = escapeXml(loc);
    const safeLastmod = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return [
        '<url>',
        `<loc>${safeLoc}</loc>`,
        safeLastmod,
        `<changefreq>${changefreq}</changefreq>`,
        `<priority>${priority}</priority>`,
        '</url>',
    ]
        .filter(Boolean)
        .join('');
}

async function fetchPublishedPosts() {
    const allPosts = [];
    let page = 1;
    let totalPages = 1;

    logSitemap('fetchPublishedPosts start', { apiBase: API_BASE });

    while (page <= totalPages) {
        const params = new URLSearchParams({
            status: 'published',
            page: String(page),
            page_size: '100',
        });

        const requestUrl = `${API_BASE}/api/blog/posts?${params.toString()}`;
        logSitemap('fetching posts page', { page, requestUrl });

        const res = await fetch(requestUrl);
        logSitemap('response received', { page, ok: res.ok, status: res.status });
        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            logSitemap('response not ok, stopping', { page, status: res.status, errorText: errorText.slice(0, 300) });
            break;
        }

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        allPosts.push(...items);

        logSitemap('page parsed', {
            page,
            itemsCount: items.length,
            totalSoFar: allPosts.length,
            totalPagesFromApi: data?.total_pages || 1,
            sampleSlugs: items.slice(0, 5).map((post) => post?.slug).filter(Boolean),
        });

        totalPages = Number(data?.total_pages || 1);
        page += 1;
    }

    logSitemap('fetchPublishedPosts complete', { totalPosts: allPosts.length });

    return allPosts;
}

function buildStaticUrls(staticPaths) {
    return staticPaths.map((path) => `${SITE_URL}${path}`);
}

// Build clean URLs for blog sections without language parameters
// Google will discover language variants through hreflang tags in page headers
function buildBlogStaticUrls() {
    const blogPaths = ['/blog', '/blog/categories', '/blog/tech-news', '/blog/archive'];
    return blogPaths.map((path) => `${SITE_URL}${path}`);
}

// Build clean post URLs without language parameters
// Language variants are indicated via hreflang tags in the blog post pages
function buildPostUrls(posts) {
    return posts
        .filter((post) => post?.slug)
        .map((post) => `${SITE_URL}/blog/${post.slug}`);
}

function buildSitemapXml(staticPaths, posts, debugInfo = null) {
    const now = new Date().toISOString();
    const staticEntries = staticPaths.map((path) =>
        buildUrlEntry(`${SITE_URL}${path}`, now, path === '/' ? '1.0' : '0.8', 'weekly')
    );

    // Blog static pages: clean URLs only
    const blogStaticEntries = buildBlogStaticUrls().map((url) =>
        buildUrlEntry(url, now, '0.8', 'weekly')
    );

    // Post URLs: clean slugs without language parameters
    // Language variants are handled via hreflang tags in page headers
    const postEntries = posts
        .filter((post) => post?.slug)
        .map((post) => {
            const updatedAt = post.updated_at || post.published_at || post.created_at || now;
            return buildUrlEntry(`${SITE_URL}/blog/${post.slug}`, updatedAt, '0.8', 'weekly');
        });

    const debugComments = debugInfo
        ? [
            `<!-- sitemap siteUrl=${escapeXml(debugInfo.siteUrl)} staticCount=${escapeXml(debugInfo.staticCount)} postCount=${escapeXml(debugInfo.postCount)} -->`,
            `<!-- Canonical urls without language parameters. Language variants via hreflang in page headers. -->`,
        ]
        : [];

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...debugComments,
        ...staticEntries,
        ...blogStaticEntries,
        ...postEntries,
        '</urlset>',
    ].join('');
}

export async function getServerSideProps({ res, query }) {
    const staticPaths = ['/', '/arena', '/agents'];
    let posts = [];
    const debugEnabled = query?.debug === '1' || query?.debug === 'true';
    const staticUrls = buildStaticUrls(staticPaths);

    logSitemap('getServerSideProps start', {
        siteUrl: SITE_URL,
        apiUrl: API_BASE,
        sitemapUrl: `${SITE_URL}/sitemap.xml`,
        staticUrls,
    });

    try {
        posts = await fetchPublishedPosts();
    } catch (error) {
        // Keep sitemap available with static routes even if API is unreachable.
        logSitemap('fetchPublishedPosts failed', { message: error?.message || String(error) });
        posts = [];
    }

    const postUrls = buildPostUrls(posts);

    logSitemap('sitemap assembly', {
        staticCount: staticPaths.length,
        postCount: posts.length,
        postUrls,
    });

    const xml = buildSitemapXml(
        staticPaths,
        posts,
        debugEnabled
            ? {
                siteUrl: SITE_URL,
                apiBase: API_BASE,
                sitemapUrl: `${SITE_URL}/sitemap.xml`,
                staticUrls,
                postUrls,
                staticCount: staticPaths.length,
                postCount: posts.length,
                requestCount: posts.length > 0 ? 1 : 0,
            }
            : null
    );

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    if (debugEnabled) {
        res.setHeader('X-Sitemap-Debug', `siteUrl=${SITE_URL};apiBase=${API_BASE};postCount=${posts.length}`);
    }
    res.write(xml);
    res.end();

    return { props: {} };
}

export default function SitemapXml() {
    return null;
}
