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

        const requestUrl = `${API_BASE}/api/v1/blog/posts?${params.toString()}`;
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

function buildSitemapXml(staticPaths, posts) {
    const now = new Date().toISOString();
    const staticEntries = staticPaths.map((path) =>
        buildUrlEntry(`${SITE_URL}${path}`, now, path === '/' ? '1.0' : '0.8', 'weekly')
    );

    const postEntries = posts
        .filter((post) => post?.slug)
        .map((post) => {
            const updatedAt = post.updated_at || post.published_at || post.created_at || now;
            return buildUrlEntry(`${SITE_URL}/blog/${post.slug}`, updatedAt, '0.8', 'weekly');
        });

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...staticEntries,
        ...postEntries,
        '</urlset>',
    ].join('');
}

export async function getServerSideProps({ res }) {
    const staticPaths = ['/', '/arena', '/agents', '/blog'];
    let posts = [];

    logSitemap('getServerSideProps start', { siteUrl: SITE_URL, apiBase: API_BASE });

    try {
        posts = await fetchPublishedPosts();
    } catch (error) {
        // Keep sitemap available with static routes even if API is unreachable.
        logSitemap('fetchPublishedPosts failed', { message: error?.message || String(error) });
        posts = [];
    }

    logSitemap('sitemap assembly', { staticCount: staticPaths.length, postCount: posts.length });

    const xml = buildSitemapXml(staticPaths, posts);

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.write(xml);
    res.end();

    return { props: {} };
}

export default function SitemapXml() {
    return null;
}
