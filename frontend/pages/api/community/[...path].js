const DEFAULT_BACKEND_URL = 'http://127.0.0.1:10000';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '12mb',
        },
    },
};

function normalizeBaseUrl(url) {
    if (!url || typeof url !== 'string') {
        return DEFAULT_BACKEND_URL;
    }

    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildBackendUrl(req, pathSegments) {
    const backendBaseUrl = process.env.NODE_ENV === 'development'
        ? DEFAULT_BACKEND_URL
        : normalizeBaseUrl(process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL);
    const path = Array.isArray(pathSegments) ? pathSegments.join('/') : '';
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

    return `${backendBaseUrl}/api/community/${path}${queryString}`;
}

function getForwardHeaders(req) {
    const headers = {};

    if (req.headers.authorization) {
        headers.authorization = req.headers.authorization;
    }

    if (req.headers['content-type']) {
        headers['content-type'] = req.headers['content-type'];
    }

    return headers;
}

function getForwardBody(req) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
        return undefined;
    }

    if (req.body === undefined || req.body === null) {
        return undefined;
    }

    if (typeof req.body === 'string') {
        return req.body;
    }

    return JSON.stringify(req.body);
}

export default async function handler(req, res) {
    const targetUrl = buildBackendUrl(req, req.query.path);

    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: getForwardHeaders(req),
            body: getForwardBody(req),
        });

        const contentType = response.headers.get('content-type') || '';
        const cacheControl = response.headers.get('cache-control');

        if (contentType.startsWith('image/') || contentType === 'application/octet-stream') {
            const arrayBuffer = await response.arrayBuffer();
            if (cacheControl) {
                res.setHeader('Cache-Control', cacheControl);
            }
            res.setHeader('Content-Type', contentType);
            return res.status(response.status).send(Buffer.from(arrayBuffer));
        }

        const textBody = await response.text();

        if (contentType.includes('application/json')) {
            try {
                const jsonBody = textBody ? JSON.parse(textBody) : {};
                return res.status(response.status).json(jsonBody);
            } catch {
                return res.status(response.status).send(textBody);
            }
        }

        return res.status(response.status).send(textBody);
    } catch (error) {
        console.error('Community API proxy error:', error);
        return res.status(502).json({ detail: 'Community API proxy failed' });
    }
}
