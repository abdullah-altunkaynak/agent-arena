/**
 * Blog Single Post Page
 * Individual blog post with dark theme and language selection
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import {
    Eye,
    ArrowLeft,
    Share2,
    Twitter,
    Linkedin,
    Instagram,
    Facebook,
    MessageCircle,
    BookOpen,
    X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import Navbar from '../../components/Navbar';
import { normalizeBlogExcerptHtml } from '../../lib/blogContent';
import { getCachedResponse, setCachedResponse, getCacheKey } from '../../lib/cache';

const BLOG_API_BASE = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? '/api/blog' : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/blog`)
    : (process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:10000/api/blog'
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/blog`);

export default function BlogPostPage({
    initialPost = null,
    initialRelatedPosts = [],
    initialPopularPosts = [],
}) {
    const router = useRouter();
    const { slug } = router.query;
    const [language, setLanguage] = useState('en');

    const API_BASE = BLOG_API_BASE;
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');

    // State
    const [post, setPost] = useState(initialPost);
    const [relatedPosts, setRelatedPosts] = useState(initialRelatedPosts);
    const [popularPosts, setPopularPosts] = useState(initialPopularPosts);
    const [loading, setLoading] = useState(!initialPost);
    const [error, setError] = useState(null);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [shareNotice, setShareNotice] = useState('');
    const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
    const [sharePlatform, setSharePlatform] = useState('x');

    const slugFromRoute = typeof slug === 'string' ? slug : '';
    const safeSlug = initialPost?.slug || slugFromRoute || 'post';

    const isDark = true;
    const isEnglish = language === 'en';
    const normalizeLang = (value) => (value === 'tr' ? 'tr' : 'en');

    useEffect(() => {
        if (!router.isReady) return;

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

    useEffect(() => {
        if (!initialPost) return;
        setPost(initialPost);
        setRelatedPosts(initialRelatedPosts);
        setPopularPosts(initialPopularPosts);
        setLoading(false);
    }, [initialPost, initialRelatedPosts, initialPopularPosts]);

    // Set HTML lang attribute dynamically based on current language
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language === 'tr' ? 'tr' : 'en';
        }
    }, [language]);

    if (loading && !post) {
        return (
            <>
                <Head>
                    <title>Loading Post | Agent Arena Blog</title>
                    <meta name="description" content="Loading blog post content." />
                </Head>
                <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
                </div>
            </>
        );
    }

    if (error || !post) {
        return (
            <>
                <Head>
                    <title>Post Not Found | Agent Arena Blog</title>
                    <meta name="description" content="The requested blog post could not be found." />
                </Head>
                <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
                    <div className="text-center">
                        <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Post not found</h1>
                        <Link href="/blog" className={isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}>
                            ← Back to Blog
                        </Link>
                    </div>
                </div>
            </>
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

    const htmlAnchorsToMarkdown = (value) => {
        if (!value) return '';

        return normalizeBlogExcerptHtml(
            String(value).replace(/<br\s*\/?>/gi, '\n')
        );
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

    // Page title already uses H1. Demote markdown H1 headings to H2 for semantic SEO structure.
    const markdownComponents = {
        h1: ({ node, ...props }) => <h2 {...props} />,
        a: ({ node, href, children, ...props }) => {
            const isInternal = href?.startsWith('/');
            return isInternal ? (
                <Link href={href}>
                    <a {...props}>{children}</a>
                </Link>
            ) : (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                >
                    {children}
                </a>
            );
        },
    };

    const truncateText = (text, maxLen) => {
        const clean = String(text || '').trim();
        if (clean.length <= maxLen) return clean;
        return `${clean.slice(0, maxLen - 1).trim()}...`;
    };

    const getShareSnippet = () => {
        const sourceText = postContent || postExcerpt || rawDescription || rawTitle;
        const normalizedText = normalizeMarkdownContent(
            htmlAnchorsToMarkdown(String(sourceText || '').replace(/<br\s*\/?>/gi, '\n'))
        );
        const paragraphs = String(normalizedText)
            .split(/\n{2,}/)
            .map((paragraph) => stripMarkdown(paragraph).replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        const firstParagraph = paragraphs[0] || stripMarkdown(sourceText).replace(/\s+/g, ' ').trim();
        const sentenceMatches = String(firstParagraph)
            .replace(/\s+/g, ' ')
            .match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [];
        const summary = (sentenceMatches.length ? sentenceMatches.slice(0, 2).join(' ') : firstParagraph).trim();
        const normalizedTitle = stripMarkdown(rawTitle).replace(/\s+/g, ' ').trim().toLowerCase();

        let cleanedSummary = summary;
        if (normalizedTitle && cleanedSummary.toLowerCase().startsWith(normalizedTitle)) {
            cleanedSummary = cleanedSummary.slice(normalizedTitle.length).replace(/^[\s:.,;\-]+/, '').trim();
        }

        return truncateText(cleanedSummary || summary, 240);
    };

    const getPostTitle = () => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostContent = () => isEnglish ? (post.content_en || post.content_tr) : (post.content_tr || post.content_en);
    const getPostExcerpt = () => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const postContent = getPostContent();
    const postExcerpt = getPostExcerpt();
    const postContentForMarkdown = htmlAnchorsToMarkdown(postContent);
    const postExcerptForMarkdown = htmlAnchorsToMarkdown(postExcerpt);
    const normalizedPostContent = normalizeMarkdownContent(postContentForMarkdown);
    const normalizedPostExcerpt = normalizeMarkdownContent(postExcerptForMarkdown);

    const rawTitle = getPostTitle() || 'Blog Post';
    const rawDescription = getPostExcerpt() || stripMarkdown(getPostContent());
    const seoTitle = truncateText(`${rawTitle} | Agent Arena Blog`, 60);
    const seoDescription = truncateText(rawDescription || rawTitle, 160);
    const langForSeo = normalizeLang(typeof router.query.lang === 'string' ? router.query.lang : language);
    // Canonical URL: clean, without language parameter (per Google SEO standards)
    const canonicalUrl = `${SITE_URL}/blog/${safeSlug}`;
    // hreflang URLs: include language parameter for proper language targeting
    const hreflangTrUrl = `${SITE_URL}/blog/${safeSlug}?lang=tr`;
    const hreflangEnUrl = `${SITE_URL}/blog/${safeSlug}?lang=en`;
    // x-default: use clean URL
    const defaultUrl = `${SITE_URL}/blog/${safeSlug}`;
    const defaultOgImage = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || `${SITE_URL}/og-default.png`;
    const seoImage = post.featured_image_url || defaultOgImage;
    const publishedAt = post.published_at || post.created_at || new Date().toISOString();
    const modifiedAt = post.updated_at || publishedAt;
    const shareText = isEnglish
        ? {
            sectionTitle: 'Share this article',
            sectionSubtitle: 'The post text is prepared automatically with title, summary, post link and homepage link.',
            popupTitle: 'Ready-to-share text',
            popupSubtitle: 'This text is prepared. Paste it into the selected social platform.',
            close: 'Close',
            copy: 'Copy ready text',
            openAgain: 'Open platform again',
            labels: {
                x: 'Share on X',
                linkedin: 'Share on LinkedIn',
                medium: 'Share on Medium',
                reddit: 'Share on Reddit',
                instagram: 'Share on Instagram',
                facebook: 'Share on Facebook',
            },
            messageReadMore: 'Read more:',
            messageHomepage: 'Homepage:',
            openedAndCopied: ' opened. Ready share text is copied to clipboard.',
            openedAndManual: ' opened. Copy the ready text below and paste it.',
            copiedAgain: 'Ready share text copied to clipboard again.',
            copyFailed: 'Copy failed. You can select the text and copy manually.',
        }
        : {
            sectionTitle: 'Bu yaziyi paylas',
            sectionSubtitle: 'Baslik, ozet, yazi linki ve ana sayfa linki otomatik hazirlanir.',
            popupTitle: 'Hazir paylasim metni',
            popupSubtitle: 'Metin hazir. Sectigin sosyal platforma yapistirabilirsin.',
            close: 'Kapat',
            copy: 'Hazir metni kopyala',
            openAgain: 'Platformu tekrar ac',
            labels: {
                x: "X'te paylas",
                linkedin: "LinkedIn'de paylas",
                medium: "Medium'da paylas",
                reddit: "Reddit'te paylas",
                instagram: "Instagram'da paylas",
                facebook: "Facebook'ta paylas",
            },
            messageReadMore: 'Devamini okumak icin:',
            messageHomepage: 'Ana sayfa:',
            openedAndCopied: ' acildi. Hazir paylasim metni panoya kopyalandi.',
            openedAndManual: ' acildi. Asagidaki hazir metni kopyalayip yapistirabilirsin.',
            copiedAgain: 'Hazir paylasim metni tekrar panoya kopyalandi.',
            copyFailed: 'Kopyalama basarisiz. Metni secip manuel kopyalayabilirsin.',
        };
    const shareSnippet = getShareSnippet();
    const shareMessage = [
        rawTitle,
        shareSnippet,
        `${shareText.messageReadMore} ${canonicalUrl}`,
        `${shareText.messageHomepage} ${SITE_URL}/`,
    ].filter(Boolean).join('\n\n');
    const shareTargets = {
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(rawTitle)}&summary=${encodeURIComponent(shareSnippet)}&source=${encodeURIComponent('Agent Arena')}`,
        medium: 'https://medium.com/new-story',
        reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(rawTitle)}`,
        instagram: 'https://www.instagram.com/',
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}&quote=${encodeURIComponent(shareMessage)}`,
    };
    const sharePlatformNames = {
        x: 'X',
        linkedin: 'LinkedIn',
        medium: 'Medium',
        reddit: 'Reddit',
        instagram: 'Instagram',
        facebook: 'Facebook',
    };

    const copyShareMessage = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;

        try {
            await navigator.clipboard.writeText(shareMessage);
            return true;
        } catch (error) {
            console.error('Error copying share text:', error);
            return false;
        }
    };

    const handleShare = async (platform) => {
        const targetUrl = shareTargets[platform];
        const copied = await copyShareMessage();

        setSharePlatform(platform);
        setIsSharePanelOpen(true);

        if (targetUrl && typeof window !== 'undefined') {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }

        setShareNotice(
            copied
                ? `${sharePlatformNames[platform] || 'Platform'}${shareText.openedAndCopied}`
                : `${sharePlatformNames[platform] || 'Platform'}${shareText.openedAndManual}`
        );
    };
    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: rawTitle,
        description: seoDescription,
        image: [seoImage],
        mainEntityOfPage: canonicalUrl,  // Use clean canonical URL
        datePublished: publishedAt,
        dateModified: modifiedAt,
        inLanguage: langForSeo === 'tr' ? 'tr' : 'en',
        author: {
            '@type': 'Organization',
            name: 'Agent Arena',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Agent Arena',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logoagentarena.png`,
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

    const newsletterText = isEnglish
        ? {
            title: 'Subscribe to Our Newsletter',
            subtitle: 'Get an email when new articles are published.',
            placeholder: 'name@email.com',
            submit: 'Subscribe',
            submitting: 'Submitting...',
            alreadySubscribed: 'You are already subscribed to the newsletter.',
            invalidEmail: 'Please enter a valid email address.',
            fallbackSuccess: 'Subscription completed successfully.',
            fallbackFailure: 'Subscription failed',
        }
        : {
            title: 'Haber Bultenimize Uye Olun',
            subtitle: 'Yeni yazilar yayinlandiginda e-posta ile bildirim alin.',
            placeholder: 'ornek@email.com',
            submit: 'Abone Ol',
            submitting: 'Gonderiliyor...',
            alreadySubscribed: 'Zaten haber bültenine kayıtlısınız.',
            invalidEmail: 'Lutfen gecerli bir e-posta adresi girin.',
            fallbackSuccess: 'Abonelik basariyla tamamlandi.',
            fallbackFailure: 'Abonelik basarisiz oldu',
        };

    const isValidEmail = (value) => {
        const email = String(value || '').trim();
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
    };

    const handleNewsletterSubmit = async (event) => {
        event.preventDefault();
        const normalizedEmail = newsletterEmail.trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            setNewsletterSuccess(false);
            setNewsletterMessage(newsletterText.invalidEmail);
            return;
        }

        try {
            setNewsletterSubmitting(true);
            setNewsletterMessage('');

            const response = await fetch('/api/blog/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                    source: 'blog_detail_footer',
                    slug,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.detail || payload?.error || newsletterText.fallbackFailure);
            }

            setNewsletterSuccess(true);
            setNewsletterMessage(
                payload?.already_subscribed
                    ? newsletterText.alreadySubscribed
                    : (payload?.message || newsletterText.fallbackSuccess)
            );
            setNewsletterEmail('');
        } catch (submitError) {
            setNewsletterSuccess(false);
            setNewsletterMessage(submitError.message || newsletterText.fallbackFailure);
        } finally {
            setNewsletterSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Head>
                <title>{seoTitle}</title>
                <meta name="description" content={seoDescription} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={defaultUrl} />

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
                            <Image
                                src={post.featured_image_url}
                                alt={getPostTitle()}
                                width={1200}
                                height={600}
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
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
                            </div>

                            {/* Excerpt */}
                            {(isEnglish ? post.excerpt_en : post.excerpt_tr) && (
                                <div className={`prose prose-lg max-w-none mb-8 ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700'} prose-p:my-0 prose-ul:my-2 prose-ol:my-2`}>
                                    <ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{normalizedPostExcerpt}</ReactMarkdown>
                                </div>
                            )}

                            {/* Content */}
                            <div className={`prose max-w-none ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-code:text-cyan-300 prose-pre:bg-slate-800 prose-blockquote:border-cyan-500 prose-blockquote:text-slate-400' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-code:text-blue-700 prose-pre:bg-slate-100 prose-blockquote:border-blue-600 prose-blockquote:text-slate-700'} prose-img:rounded-lg prose-img:w-full`}>
                                <ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeRaw, rehypeSanitize]}>{normalizedPostContent}</ReactMarkdown>
                            </div>

                            {/* Social Share */}
                            <div className={`mt-12 rounded-xl border p-6 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'}`}>
                                        <Share2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {shareText.sectionTitle}
                                        </h3>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {shareText.sectionSubtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { key: 'x', label: shareText.labels.x, icon: Twitter, className: isDark ? 'bg-slate-900 text-white hover:bg-slate-700 border border-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800' },
                                        { key: 'linkedin', label: shareText.labels.linkedin, icon: Linkedin, className: 'bg-[#0A66C2] text-white hover:bg-[#0958a8]' },
                                        { key: 'medium', label: shareText.labels.medium, icon: BookOpen, className: isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700' },
                                        { key: 'reddit', label: shareText.labels.reddit, icon: MessageCircle, className: 'bg-[#FF4500] text-white hover:bg-[#e63f00]' },
                                        { key: 'instagram', label: shareText.labels.instagram, icon: Instagram, className: 'bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white hover:opacity-90' },
                                        { key: 'facebook', label: shareText.labels.facebook, icon: Facebook, className: 'bg-[#1877F2] text-white hover:bg-[#1668d3]' },
                                    ].map((button) => (
                                        <button
                                            key={button.key}
                                            type="button"
                                            onClick={() => handleShare(button.key)}
                                            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${button.className}`}
                                        >
                                            <button.icon size={16} />
                                            {button.label}
                                        </button>
                                    ))}
                                </div>

                                {shareNotice ? (
                                    <p className={`mt-4 text-sm ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                                        {shareNotice}
                                    </p>
                                ) : null}
                            </div>

                            {/* Newsletter Subscription */}
                            <div className={`mt-12 rounded-xl border p-6 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {newsletterText.title}
                                </h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {newsletterText.subtitle}
                                </p>

                                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        placeholder={newsletterText.placeholder}
                                        className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterSubmitting}
                                        className={`px-5 py-2 rounded-lg font-semibold transition disabled:opacity-60 ${isDark ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {newsletterSubmitting ? newsletterText.submitting : newsletterText.submit}
                                    </button>
                                </form>

                                {newsletterMessage ? (
                                    <p className={`text-sm mt-3 ${newsletterSuccess ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-700')}`}>
                                        {newsletterMessage}
                                    </p>
                                ) : null}
                            </div>
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

            {isSharePanelOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <button
                        type="button"
                        aria-label="Close share popup"
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setIsSharePanelOpen(false)}
                    />
                    <div className={`relative w-full max-w-2xl rounded-xl border p-6 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {`${sharePlatformNames[sharePlatform] || 'Platform'} - ${shareText.popupTitle}`}
                                </h4>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {shareText.popupSubtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSharePanelOpen(false)}
                                className={`rounded-lg p-2 transition ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <textarea
                            value={shareMessage}
                            readOnly
                            rows={8}
                            className={`w-full rounded-lg border px-3 py-2 text-sm leading-relaxed ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-slate-900 border-slate-600 text-slate-100'}`}
                            style={{
                                backgroundColor: '#0f172a',
                                color: '#e2e8f0',
                            }}
                        />

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    const copied = await copyShareMessage();
                                    setShareNotice(copied ? shareText.copiedAgain : shareText.copyFailed);
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {shareText.copy}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const targetUrl = shareTargets[sharePlatform];
                                    if (targetUrl && typeof window !== 'undefined') {
                                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
                            >
                                {shareText.openAgain}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSharePanelOpen(false)}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                            >
                                {shareText.close}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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
        // Check cache first for post
        const postCacheKey = getCacheKey('blog_post', { slug });
        let initialPost = getCachedResponse(postCacheKey);

        if (!initialPost) {
            const resolveResponse = await fetch(
                `${BLOG_API_BASE}/posts/resolve-slug/${encodeURIComponent(slug)}`
            );

            if (!resolveResponse.ok) {
                return { props: { initialPost: null, initialRelatedPosts: [], initialPopularPosts: [] } };
            }

            const resolved = await resolveResponse.json();
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

            const postResponse = await fetch(`${BLOG_API_BASE}/posts/slug/${encodeURIComponent(slug)}`);
            if (!postResponse.ok) {
                return { props: { initialPost: null, initialRelatedPosts: [], initialPopularPosts: [] } };
            }

            initialPost = await postResponse.json();
            // Cache post for 5 minutes
            setCachedResponse(postCacheKey, initialPost, 300000);
        }

        // Fetch related posts - cache by category
        const relatedCacheKey = getCacheKey('blog_related', { category_id: initialPost.category_id });
        let relatedPostsData = getCachedResponse(relatedCacheKey);

        if (!relatedPostsData && initialPost?.category_id) {
            const relatedResponse = await fetch(
                `${BLOG_API_BASE}/posts?category_id=${initialPost.category_id}&page_size=3`
            ).then((r) => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
            setCachedResponse(relatedCacheKey, relatedResponse, 600000); // 10 min cache
            relatedPostsData = relatedResponse;
        } else if (!relatedPostsData) {
            relatedPostsData = { items: [] };
        }

        // Fetch popular posts - cache globally
        const popularCacheKey = getCacheKey('blog_popular', {});
        let popularPostsData = getCachedResponse(popularCacheKey);

        if (!popularPostsData) {
            const popularResponse = await fetch(
                `${BLOG_API_BASE}/posts?status=published&page_size=10`
            ).then((r) => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
            setCachedResponse(popularCacheKey, popularResponse, 600000); // 10 min cache
            popularPostsData = popularResponse;
        }

        const sortedPopular = (popularPostsData?.items || [])
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5);

        return {
            props: {
                initialPost,
                initialRelatedPosts: (relatedPostsData?.items || []).filter((p) => p.id !== initialPost.id).slice(0, 3),
                initialPopularPosts: sortedPopular,
            },
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return { props: { initialPost: null, initialRelatedPosts: [], initialPopularPosts: [] } };
    }
}
