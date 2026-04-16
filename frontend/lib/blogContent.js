const LINK_MARKDOWN_REGEX = /(!?)\[([^\]]+)\]\(([^)]+)\)/g;

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildAnchorTag = (href, label) => {
    const safeHref = String(href || '').trim();
    const safeLabel = String(label || '').trim() || safeHref;

    if (!safeHref) {
        return safeLabel;
    }

    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeLabel)}</a>`;
};

export const markdownLinksToAnchors = (value) => {
    if (!value) return '';

    return String(value).replace(LINK_MARKDOWN_REGEX, (match, bang, label, href) => {
        if (bang === '!') {
            return match;
        }

        return buildAnchorTag(href, label);
    });
};

export const normalizeBlogExcerptHtml = (value) => {
    if (!value) return '';

    const markdownConverted = markdownLinksToAnchors(value);

    return String(markdownConverted)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attributes, label) => {
            const hrefMatch = attributes.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
            const href = hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '';
            const plainLabel = String(label).replace(/<[^>]+>/g, '').trim() || href;

            return buildAnchorTag(href, plainLabel);
        })
        .replace(/\son\w+=(["'][^"']*["']|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');
};
