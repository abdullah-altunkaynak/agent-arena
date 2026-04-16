export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const localApiBase = 'http://127.0.0.1:10000/api/blog';
    const remoteApiBase = process.env.NEXT_PUBLIC_BLOG_API_URL
        || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/blog`;
    const apiBase = process.env.NODE_ENV === 'development' ? localApiBase : remoteApiBase;

    try {
        const response = await fetch(`${apiBase}/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(req.body || {}),
        });

        const payload = await response.text();
        res.status(response.status);
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        return res.send(payload);
    } catch (error) {
        return res.status(502).json({ error: 'Failed to subscribe via upstream API' });
    }
}
