export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const localApiBase = 'http://127.0.0.1:10000/api/blog';
    const remoteApiBase = process.env.NEXT_PUBLIC_BLOG_API_URL
        || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/blog`;
    const apiBase = process.env.NODE_ENV === 'development' ? localApiBase : remoteApiBase;

    const targetUrl = new URL(`${apiBase}/categories`);
    const query = req.query || {};

    Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => targetUrl.searchParams.append(key, String(item)));
        } else if (value !== undefined && value !== null && value !== '') {
            targetUrl.searchParams.set(key, String(value));
        }
    });

    try {
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        const payload = await response.text();
        res.status(response.status);
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        return res.send(payload);
    } catch (error) {
        return res.status(502).json({ error: 'Failed to fetch categories from upstream API' });
    }
}