/**
 * Blog Single Post Page
 * Individual blog post with dark theme and language selection
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    Eye,
    Calendar,
    ArrowLeft,
    Share2,
    Bookmark,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';

const BLOG_API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`;

export default function BlogPostPage() {
    const router = useRouter();
    const { slug } = router.query;
    const [mounted, setMounted] = useState(false);
    const [language, setLanguage] = useState('en');

    const API_BASE = BLOG_API_BASE;
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');

    // State
    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [popularPosts, setPopularPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isDark = true;
    const isEnglish = language === 'en';
    const normalizeLang = (value) => (value === 'tr' ? 'tr' : 'en');

    useEffect(() => {
        if (!router.isReady) return;

        setMounted(true);
        const queryLang = typeof router.query.lang === 'string' ? normalizeLang(router.query.lang) : null;
        const savedLang = normalizeLang(localStorage.getItem('blogLanguage'));
        const selectedLang = queryLang || savedLang;

        setLanguage(selectedLang);
        localStorage.setItem('blogLanguage', selectedLang);

        if (!queryLang) {
            router.replace(
                {
                    pathname: router.pathname,
                    query: { ...router.query, lang: selectedLang },
                },
                undefined,
                { shallow: true }
            );
        }
    }, [router.isReady, router.query.lang]);

    // Fetch post
    useEffect(() => {
        if (!slug) return;

        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch post
                const response = await fetch(`${API_BASE}/posts/slug/${slug}`);
                if (!response.ok) throw new Error('Post not found');

                const postData = await response.json();
                setPost(postData);

                // Fetch related posts (same category)
                if (postData.category_id) {
                    const relatedResponse = await fetch(
                        `${API_BASE}/posts?category_id=${postData.category_id}&page_size=3`
                    );
                    const relatedData = await relatedResponse.json();
                    setRelatedPosts(
                        relatedData.items.filter((p) => p.id !== postData.id).slice(0, 3)
                    );
                }

                // Fetch popular posts (top 5 by view count)
                const popularResponse = await fetch(
                    `${API_BASE}/posts?status=published&page_size=10`
                );
                const popularData = await popularResponse.json();
                const sorted = (popularData.items || [])
                    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                    .slice(0, 5);
                setPopularPosts(sorted);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (!mounted) return null;

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
                <div className="text-center">
                    <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Post not found</h1>
                    <Link href="/blog" className={isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}>
                        ← Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const stripMarkdown = (text) => {
        return String(text || '')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/`[^`]*`/g, ' ')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/[>#*_~\-|]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const sanitizeHtmlContent = (html) => {
        if (!html) return '';

        return String(html)
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
            .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/javascript:/gi, '');
    };

    const isLikelyHtml = (value) => /<\s*\/?\s*[a-z][^>]*>/i.test(String(value || ''));

    const hasMarkdownSyntax = (value) => {
        const text = String(value || '');
        return /(#{1,6}\s)|(^|\s)-\s+|(\d+\.\s)|(```)|(\*\*[^*]+\*\*)/.test(text);
    };

    const htmlAnchorsToMarkdown = (value) => {
        if (!value) return '';

        return String(value)
            .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
                const plainLabel = String(label).replace(/<[^>]+>/g, '').trim() || href;
                return `[${plainLabel}](${href})`;
            })
            .replace(/<br\s*\/?>/gi, '\n');
    };

    const normalizeMarkdownContent = (value) => {
        if (!value) return '';

        return String(value)
            .replace(/\r\n/g, '\n')
            .replace(/\u00a0/g, ' ')
            // Headings become valid only when they start at line-start.
            .replace(/\s(#{1,6}\s)/g, '\n\n$1')
            // Numbered lists in collapsed text need a line break before each item.
            .replace(/\s(\d+\.\s)/g, '\n\n$1')
            // Convert inline "- item" segments into actual markdown lists.
            .replace(/([:.])\s-\s+/g, '$1\n- ')
            .replace(/\s-\s(?=[A-Z0-9*])/g, '\n- ')
            // Avoid excessive blank lines created by normalization.
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    const truncateText = (text, maxLen) => {
        const clean = String(text || '').trim();
        if (clean.length <= maxLen) return clean;
        return `${clean.slice(0, maxLen - 1).trim()}...`;
    };

    const getPostTitle = () => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostContent = () => isEnglish ? (post.content_en || post.content_tr) : (post.content_tr || post.content_en);
    const getPostExcerpt = () => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const getPostContentHtml = () => sanitizeHtmlContent(getPostContent());
    const getPostExcerptHtml = () => sanitizeHtmlContent(getPostExcerpt());
    const postContent = getPostContent();
    const postExcerpt = getPostExcerpt();
    const postContentForMarkdown = htmlAnchorsToMarkdown(postContent);
    const postExcerptForMarkdown = htmlAnchorsToMarkdown(postExcerpt);
    const contentIsHtml = isLikelyHtml(postContent) && !hasMarkdownSyntax(postContentForMarkdown);
    const excerptIsHtml = isLikelyHtml(postExcerpt) && !hasMarkdownSyntax(postExcerptForMarkdown);
    const normalizedPostContent = normalizeMarkdownContent(postContentForMarkdown);
    const normalizedPostExcerpt = normalizeMarkdownContent(postExcerptForMarkdown);

    const rawTitle = getPostTitle() || 'Blog Post';
    const rawDescription = getPostExcerpt() || stripMarkdown(getPostContent());
    const seoTitle = truncateText(`${rawTitle} | Agent Arena Blog`, 60);
    const seoDescription = truncateText(rawDescription || rawTitle, 160);
    const canonicalUrl = `${SITE_URL}/blog/${slug}`;
    const hreflangTrUrl = `${SITE_URL}/blog/${slug}?lang=tr`;
    const hreflangEnUrl = `${SITE_URL}/blog/${slug}?lang=en`;
    const defaultOgImage = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || `${SITE_URL}/og-default.png`;
    const seoImage = post.featured_image_url || defaultOgImage;
    const publishedAt = post.published_at || post.created_at || new Date().toISOString();
    const modifiedAt = post.updated_at || publishedAt;
    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: rawTitle,
        description: seoDescription,
        image: [seoImage],
        mainEntityOfPage: canonicalUrl,
        datePublished: publishedAt,
        dateModified: modifiedAt,
        inLanguage: isEnglish ? 'en' : 'tr',
        author: {
            '@type': 'Organization',
            name: 'Agent Arena',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Agent Arena',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`,
            },
        },
    };
    const blogPostBreadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: `${SITE_URL}/blog`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: rawTitle,
                item: canonicalUrl,
            },
        ],
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="Agent Arena" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={seoTitle} />
                <meta property="og:description" content={seoDescription} />
                <meta property="og:image" content={seoImage} />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seoTitle} />
                <meta name="twitter:description" content={seoDescription} />
                <meta name="twitter:image" content={seoImage} />

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostBreadcrumbJsonLd) }}
                />
            </Head>
            {/* Main Navbar */}
            <Navbar />

            {/* Header Sticky */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/90 border-slate-200'} border-b sticky top-16 z-10 backdrop-blur`}>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/blog"
                        className={`inline-flex items-center gap-2 transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                        <ArrowLeft size={18} />
                        Back to Blog
                    </Link>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <div className={`flex items-center gap-1 p-1.5 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <button
                                onClick={() => {
                                    setLanguage('en');
                                    localStorage.setItem('blogLanguage', 'en');
                                    router.replace(
                                        {
                                            pathname: router.pathname,
                                            query: { ...router.query, lang: 'en' },
                                        },
                                        undefined,
                                        { shallow: true }
                                    );
                                }}
                                className={`px-2.5 py-1.5 rounded text-xs font-bold transition ${language === 'en'
                                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => {
                                    setLanguage('tr');
                                    localStorage.setItem('blogLanguage', 'tr');
                                    router.replace(
                                        {
                                            pathname: router.pathname,
                                            query: { ...router.query, lang: 'tr' },
                                        },
                                        undefined,
                                        { shallow: true }
                                    );
                                }}
                                className={`px-2.5 py-1.5 rounded text-xs font-bold transition ${language === 'tr'
                                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                TR
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-12">
                    {/* Featured Image */}
                    {post.featured_image_url && (
                        <div className={`w-full h-96 rounded-xl overflow-hidden mb-8 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <img
                                src={post.featured_image_url}
                                alt={getPostTitle()}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Layout Container with Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Article Content - 2/3 width */}
                        <div className="lg:col-span-2">
                            {/* Category Badge */}
                            <div className="mb-6 inline-block">
                                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'}`}>
                                    Featured
                                </span>
                            </div>

                            {/* Title */}
                            <h1 style={{ color: isDark ? '#ffffff' : '#1a1a1a' }} className={`text-5xl md:text-6xl font-bold mb-6 leading-tight`}>
                                {getPostTitle()}
                            </h1>

                            {/* Author and Meta */}
                            <div className={`flex flex-wrap items-center gap-4 mb-8 pb-8 ${isDark ? 'border-slate-700' : 'border-slate-200'} border-b`}>
                                <div
                                    className="flex items-center gap-3"
                                    style={{ color: isDark ? '#94a3b8' : '#1f2937' }}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-yellow-500/20 text-yellow-500' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {post.author?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <div
                                            className="font-semibold"
                                            style={{ color: isDark ? '#ffffff' : '#111827' }}
                                        >
                                            {post.author || 'Agent Arena'}
                                        </div>
                                        <div
                                            className="text-xs"
                                            style={{ color: isDark ? '#94a3b8' : '#4b5563' }}
                                        >
                                            {new Date(post.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                            {' '} • {Math.ceil((post.content_tr?.split(' ').length || 0) / 200)} min read
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <button className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                        <Share2 size={18} className={isDark ? 'text-slate-400' : 'text-slate-700'} />
                                    </button>
                                    <button className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                        <Bookmark size={18} className={isDark ? 'text-slate-400' : 'text-slate-700'} />
                                    </button>
                                </div>
                            </div>

                            {/* Excerpt */}
                            {(isEnglish ? post.excerpt_en : post.excerpt_tr) && (
                                excerptIsHtml ? (
                                    <div
                                        className={`prose prose-lg max-w-none mb-8 ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700'} prose-p:my-0 prose-ul:my-2 prose-ol:my-2`}
                                        dangerouslySetInnerHTML={{ __html: getPostExcerptHtml() }}
                                    />
                                ) : (
                                    <div className={`prose prose-lg max-w-none mb-8 ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700'} prose-p:my-0 prose-ul:my-2 prose-ol:my-2`}>
                                        <ReactMarkdown>{normalizedPostExcerpt}</ReactMarkdown>
                                    </div>
                                )
                            )}

                            {/* Content */}
                            {contentIsHtml ? (
                                <div
                                    className={`prose max-w-none ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-code:text-cyan-300 prose-pre:bg-slate-800 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-400' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-code:text-blue-700 prose-pre:bg-slate-100 prose-blockquote:border-blue-600 prose-blockquote:text-slate-700'} prose-img:rounded-lg prose-img:w-full`}
                                    dangerouslySetInnerHTML={{ __html: getPostContentHtml() }}
                                />
                            ) : (
                                <div className={`prose max-w-none ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-code:text-cyan-300 prose-pre:bg-slate-800 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-400' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-code:text-blue-700 prose-pre:bg-slate-100 prose-blockquote:border-blue-600 prose-blockquote:text-slate-700'} prose-img:rounded-lg prose-img:w-full`}>
                                    <ReactMarkdown>{normalizedPostContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - 1/3 width */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-8 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                                {/* Status/Info Box */}
                                <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                                        Article Digest
                                    </h4>
                                    <div
                                        className="space-y-3 text-sm"
                                        style={{ color: isDark ? '#cbd5e1' : '#111827' }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>Reading time</span>
                                            <span className="font-semibold">{Math.ceil((getPostContent()?.split(' ').length || 0) / 200)} min</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Published</span>
                                            <span className="font-semibold">
                                                {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Views</span>
                                            <span className="font-semibold">{post.view_count}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Popular Posts Widget */}
                                {popularPosts.length > 0 && (
                                    <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                            🔥 Popular Now
                                        </h4>
                                        <div className="space-y-3">
                                            {popularPosts.map((popPost, idx) => (
                                                <Link key={popPost.id} href={`/blog/${popPost.slug}`}>
                                                    <div className={`p-3 rounded-lg transition cursor-pointer group ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}>
                                                        <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400 group-hover:text-red-400' : 'text-slate-600 group-hover:text-red-600'}`}>
                                                            #{idx + 1}
                                                        </h5>
                                                        <p className={`text-sm font-semibold line-clamp-2 mb-2 ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-950'}`}>
                                                            {isEnglish ? (popPost.title_en || popPost.title_tr) : (popPost.title_tr || popPost.title_en)}
                                                        </p>
                                                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                                                            <Eye size={12} />
                                                            <span>{popPost.view_count} views</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Related Posts */}
                                {relatedPosts.length > 0 && (
                                    <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        <h4 className={`text-sm font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                                            Related Posts
                                        </h4>
                                        <div className="space-y-4">
                                            {relatedPosts.map((relatedPost) => (
                                                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                                                    <div className={`group cursor-pointer p-4 rounded-lg transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white'}`}>
                                                        <h5 className={`text-sm font-semibold mb-2 line-clamp-2 ${isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-blue-700'}`}>
                                                            {isEnglish ? (relatedPost.title_en || relatedPost.title_tr) : (relatedPost.title_tr || relatedPost.title_en)}
                                                        </h5>
                                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>
                                                            {new Date(relatedPost.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    const rawSlug = context?.params?.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    if (!slug) {
        return { props: {} };
    }

    try {
        const response = await fetch(
            `${BLOG_API_BASE}/posts/resolve-slug/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
            return { props: {} };
        }

        const resolved = await response.json();
        if (!resolved?.found) {
            return { notFound: true };
        }

        if (resolved?.found && resolved?.redirect_to && resolved.redirect_to !== slug) {
            const lang = context?.query?.lang;
            const langQuery = typeof lang === 'string' ? `?lang=${encodeURIComponent(lang)}` : '';
            return {
                redirect: {
                    destination: `/blog/${encodeURIComponent(resolved.redirect_to)}${langQuery}`,
                    permanent: true,
                },
            };
        }
    } catch (error) {
        // Keep page render resilient if API is temporarily unavailable.
    }

    return { props: {} };
}
