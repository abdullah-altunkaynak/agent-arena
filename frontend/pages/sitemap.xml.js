const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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

    while (page <= totalPages) {
        const params = new URLSearchParams({
            status: 'published',
            page: String(page),
            page_size: '100',
        });

        const res = await fetch(`${API_BASE}/api/v1/blog/posts?${params.toString()}`);
        if (!res.ok) break;

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        allPosts.push(...items);

        totalPages = Number(data?.total_pages || 1);
        page += 1;
    }

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

    try {
        posts = await fetchPublishedPosts();
    } catch (error) {
        // Keep sitemap available with static routes even if API is unreachable.
        posts = [];
    }

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
