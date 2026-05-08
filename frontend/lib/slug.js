export const slugify = (value) => {
    if (!value) return '';

    return String(value)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const ensureSlug = (value, fallback = 'item') => slugify(value) || fallback;
