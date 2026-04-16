import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
    Eye,
    Calendar,
    Tag,
    Flame,
    TrendingUp,
    Clock,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function BlogPage() {
    const router = useRouter();
    const [language, setLanguage] = useState('en');
    const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? '/api/blog'
        : (process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`);
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');

    const [featuredPost, setFeaturedPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [randomShowcasePosts, setRandomShowcasePosts] = useState([]);
    const [randomShowcaseCategories, setRandomShowcaseCategories] = useState([]);
    const [showcaseReady, setShowcaseReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const PAGE_SIZE = 10;

    const isDark = true;
    const isEnglish = language === 'en';
    const normalizeLang = (value) => (value === 'tr' ? 'tr' : 'en');

    // i18n strings
    const t = {
        en: {
            insights: 'Insights',
            articles: 'Articles',
            subtitle: 'Explore the latest developments in AI, automation, and industrial innovation',
            allCategories: 'All Categories',
            latest: 'Latest',
            trending: 'Trending',
            popular: 'Popular',
            tags: 'Tags',
            categories: 'Categories',
            readMore: 'Read More',
            noArticles: 'No articles found',
            language: 'Language',
            english: 'English',
            turkish: 'Turkish',
            featured: 'Featured',
        },
        tr: {
            insights: 'Yazılar',
            articles: 'Makaleler',
            subtitle: 'Yapay zeka, otomasyon ve endüstriyel inovasyondaki en son gelişmeleri keşfedin',
            allCategories: 'Tüm Kategoriler',
            latest: 'Son Yazılar',
            trending: 'Trend Yapanlar',
            popular: 'Popüler',
            tags: 'Etiketler',
            categories: 'Kategoriler',
            readMore: 'Devamını Oku',
            noArticles: 'Makale bulunamadı',
            language: 'Dil',
            english: 'English',
            turkish: 'Türkçe',
            featured: 'Öne Çıkanlar',
        }
    };

    const trans = t[language];

    useEffect(() => {
        if (!router.isReady) return;

        const queryLang = typeof router.query.lang === 'string' ? normalizeLang(router.query.lang) : null;
        const savedLang = normalizeLang(localStorage.getItem('blogLanguage'));
        const selectedLang = queryLang || savedLang;

        setLanguage(selectedLang);
        localStorage.setItem('blogLanguage', selectedLang);

        // Set HTML lang attribute dynamically
        if (typeof document !== 'undefined') {
            document.documentElement.lang = selectedLang === 'tr' ? 'tr' : 'en';
        }

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

    useEffect(() => {
        if (!router.isReady) return;

        const incomingCategory = typeof router.query.category === 'string' ? router.query.category : 'all';
        setSelectedCategory(incomingCategory || 'all');
        setCurrentPage(1);
    }, [router.isReady, router.query.category]);

    // Fetch non-blocking data when component mounts
    useEffect(() => {
        if (!router.isReady) return;

        const fetchData = async () => {
            await Promise.all([fetchCategories(), fetchWidgetPosts()]);
            setShowcaseReady(true);
        };
        fetchData();
    }, [router.isReady]);

    // Re-fetch posts when category changes
    useEffect(() => {
        if (router.isReady && showcaseReady) {
            fetchPosts();
        }
    }, [router.isReady, showcaseReady, selectedCategory, currentPage]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                status: 'published',
                page: String(currentPage),
                page_size: String(PAGE_SIZE),
            });

            if (selectedCategory !== 'all') {
                params.append('category_id', selectedCategory);
            }

            const response = await fetch(`${API_BASE}/posts?${params}`);
            const data = await response.json();
            setPosts(data.items || []);
            setTotalPages(Math.max(data.total_pages || 1, 1));
            setTotalPosts(data.total || 0);

            // Set featured post as first post
            if (data.items && data.items.length > 0) {
                setFeaturedPost(data.items[0]);
            } else {
                setFeaturedPost(null);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]);
            setTotalPages(1);
            setTotalPosts(0);
            setFeaturedPost(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/blog/categories');
            if (!response.ok) {
                throw new Error(`Categories request failed with status ${response.status}`);
            }
            const data = await response.json();
            const normalizedCategories = Array.isArray(data)
                ? data
                : Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.categories)
                        ? data.categories
                        : [];

            setCategories(normalizedCategories);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setCategories([]);
        }
    };

    const fetchWidgetPosts = async () => {
        try {
            // Keep this lightweight so hero random cards and side widgets render quickly.
            const params = new URLSearchParams({
                status: 'published',
                page: '1',
                page_size: '40',
            });

            const response = await fetch(`${API_BASE}/posts?${params}`);
            if (!response.ok) {
                throw new Error(`Widget posts request failed with status ${response.status}`);
            }

            const data = await response.json();
            setAllPosts(data.items || []);
        } catch (err) {
            console.error('Error fetching widget posts:', err);
            setAllPosts([]);
        }
    };

    useEffect(() => {
        setFilteredPosts(posts);
    }, [posts]);

    const pickRandomItems = (items, count) => {
        const source = Array.isArray(items) ? items.slice() : [];
        for (let i = source.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [source[i], source[j]] = [source[j], source[i]];
        }
        return source.slice(0, Math.min(count, source.length));
    };

    useEffect(() => {
        if (allPosts.length === 0) {
            setRandomShowcasePosts([]);
            return;
        }
        setRandomShowcasePosts(pickRandomItems(allPosts, 5));
    }, [allPosts]);

    useEffect(() => {
        if (categories.length === 0) {
            setRandomShowcaseCategories([]);
            return;
        }
        setRandomShowcaseCategories(pickRandomItems(categories, 8));
    }, [categories]);

    const getTrendingPosts = () => {
        return allPosts.slice().sort((a, b) => getViewCount(b) - getViewCount(a)).slice(0, 5);
    };

    const getLatestPosts = () => {
        return allPosts.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    };

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'tr' : 'en';
        setLanguage(newLang);
        localStorage.setItem('blogLanguage', newLang);
        router.replace(
            {
                pathname: router.pathname,
                query: { ...router.query, lang: newLang },
            },
            undefined,
            { shallow: true }
        );
    };

    const applyCategoryFilter = (categoryId) => {
        const normalized = categoryId || 'all';
        setSelectedCategory(normalized);
        setCurrentPage(1);

        const nextQuery = { ...router.query, lang: language };
        if (normalized === 'all') {
            delete nextQuery.category;
        } else {
            nextQuery.category = normalized;
        }

        router.replace(
            {
                pathname: router.pathname,
                query: nextQuery,
            },
            undefined,
            { shallow: true }
        );
    };

    const getPostTitle = (post) => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostExcerpt = (post) => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const getViewCount = (post) => {
        const raw = post?.view_count ?? post?.views ?? post?.viewCount ?? 0;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const sanitizeHtmlContent = (html) => {
        if (!html) return '';

        return String(html)
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
            .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/javascript:/gi, '');
    };
    const getPostExcerptHtml = (post) => sanitizeHtmlContent(getPostExcerpt(post));
    const getCategoryName = (cat) =>
        isEnglish
            ? (cat?.name_en || cat?.name_tr || cat?.name || 'Unnamed')
            : (cat?.name_tr || cat?.name_en || cat?.name || 'Isimsiz');

    const techNewsCategory = categories.find((cat) => {
        const nameEn = String(cat?.name_en || '').toLowerCase();
        const nameTr = String(cat?.name_tr || '').toLowerCase();
        const nameAny = String(cat?.name || '').toLowerCase();
        return nameEn === 'tech news'
            || nameTr === 'teknoloji haberleri'
            || nameAny === 'tech news'
            || nameAny === 'teknoloji haberleri';
    });
    const hasCategoryIcon = (cat) => typeof cat?.icon === 'string' && cat.icon.trim().length > 0;
    const langForSeo = normalizeLang(typeof router.query.lang === 'string' ? router.query.lang : language);
    // Canonical URL: clean, without language parameter
    const canonicalUrl = `${SITE_URL}/blog`;
    // hreflang URLs: include language parameter for proper language targeting
    const hreflangTrUrl = `${SITE_URL}/blog?lang=tr`;
    const hreflangEnUrl = `${SITE_URL}/blog?lang=en`;
    // x-default: use clean URL
    const defaultUrl = `${SITE_URL}/blog`;
    const blogBreadcrumbJsonLd = {
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
        ],
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Head>
                <title>{trans.insights} & {trans.articles}</title>
                <meta name="description" content={trans.subtitle} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Agent Arena" />
                <meta property="og:title" content={`${trans.insights} & ${trans.articles}`} />
                <meta property="og:description" content={trans.subtitle} />
                <meta property="og:url" content={canonicalUrl} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={defaultUrl} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumbJsonLd) }}
                />
            </Head>
            {/* Main Navbar */}
            <Navbar />

            {/* Showcase Section */}
            <div className={`pt-20 pb-12 px-4 ${isDark ? 'bg-gradient-to-b from-slate-800/50 to-slate-900 border-b border-slate-700' : 'bg-gradient-to-b from-slate-50 to-white border-b border-slate-200'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className={`text-5xl md:text-6xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <span className={isDark ? 'text-cyan-400' : 'text-blue-600'}>{trans.insights}</span> & {trans.articles}
                            </h1>
                            <p className={`text-lg max-w-2xl ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                {trans.subtitle}
                            </p>
                        </div>

                        {/* Language Toggle */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            <button
                                onClick={toggleLanguage}
                                className={`px-3 py-1.5 rounded font-medium transition ${language === 'en'
                                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                EN
                            </button>
                            <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                            <button
                                onClick={toggleLanguage}
                                className={`px-3 py-1.5 rounded font-medium transition ${language === 'tr'
                                    ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                TR
                            </button>
                        </div>
                    </div>

                    <Link
                        href={`/blog/tech-news?lang=${language}`}
                        className={`block rounded-xl border p-5 md:p-6 transition mb-6 ${isDark
                            ? 'bg-gradient-to-r from-cyan-500/15 via-slate-800 to-slate-800 border-cyan-500/40 hover:border-cyan-400'
                            : 'bg-gradient-to-r from-blue-100 via-white to-white border-blue-300 hover:border-blue-400'
                            }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                                    {isEnglish ? 'Most Important Stream' : 'En Onemli Akis'}
                                </p>
                                <h2 className={`text-2xl md:text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {isEnglish ? 'Tech News' : 'Teknoloji Haberleri'}
                                </h2>
                                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {isEnglish
                                        ? 'Latest AI-powered technology news posts, sorted from newest to oldest in one place.'
                                        : 'Yapay zeka tarafindan uretilen guncel teknoloji haberleri, yeni tarihten eskiye tek sayfada.'}
                                </p>
                            </div>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'}`}>
                                <Sparkles size={16} />
                                {isEnglish ? 'Open Tech News Feed' : 'Tech News Akisini Ac'}
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {techNewsCategory ? (
                            <p className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {isEnglish
                                    ? `Connected category: ${getCategoryName(techNewsCategory)}`
                                    : `Bagli kategori: ${getCategoryName(techNewsCategory)}`}
                            </p>
                        ) : null}
                    </Link>

                    <Link
                        href={`/blog/archive?lang=${language}`}
                        className={`block rounded-xl border p-4 md:p-5 transition mb-6 ${isDark
                            ? 'bg-slate-800/60 border-slate-700 hover:border-cyan-400/50'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                            }`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className={`text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                                    {isEnglish ? 'Full Archive' : 'Tam Arsiv'}
                                </p>
                                <h2 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {isEnglish ? 'Browse every published article' : 'Yayinlanmis tum yazilari gez'}
                                </h2>
                            </div>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'}`}>
                                {isEnglish ? 'Open Archive' : 'Arsivi Ac'}
                                <ChevronRight size={16} />
                            </span>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-8">
                        {randomShowcasePosts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <div className={`rounded-lg overflow-hidden border h-full cursor-pointer group ${isDark ? 'bg-slate-800/40 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                    {post.featured_image_url ? (
                                        <div className="relative w-full h-28 overflow-hidden">
                                            <Image
                                                src={post.featured_image_url}
                                                alt={getPostTitle(post)}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : null}
                                    <div className="p-3">
                                        <h3 className={`text-sm font-bold line-clamp-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                            {getPostTitle(post)}
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mt-4">
                        {randomShowcaseCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => applyCategoryFilter(cat.id)}
                                className={`text-left rounded-lg border p-3 transition ${isDark ? 'bg-slate-800/40 border-slate-700 hover:border-cyan-500/50 text-slate-200' : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'}`}
                            >
                                <div className="text-xs mb-1">{hasCategoryIcon(cat) ? cat.icon : '•'}</div>
                                <div className="text-xs font-semibold line-clamp-2">{getCategoryName(cat)}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* LEFT SIDEBAR */}
                    <div className="space-y-6">
                        {/* Latest Posts Widget */}
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                            <div className={`p-4 flex items-center gap-2 border-b font-bold uppercase text-sm tracking-wider ${isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'}`}>
                                <Clock size={16} /> {trans.latest}
                            </div>
                            <div className="p-4 space-y-3">
                                {getLatestPosts().map((post) => (
                                    <Link key={post.id} href={`/blog/${post.slug}`}>
                                        <div className={`p-3 rounded-lg transition cursor-pointer group ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                                            <h4 className={`text-sm font-semibold line-clamp-2 mb-1 group-hover:text-cyan-400 transition ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                {getPostTitle(post)}
                                            </h4>
                                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>
                                                {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Trending Widget */}
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                            <div className={`p-4 flex items-center gap-2 border-b font-bold uppercase text-sm tracking-wider ${isDark ? 'bg-slate-800 border-slate-700 text-red-400' : 'bg-white border-slate-200 text-red-600'}`}>
                                <TrendingUp size={16} /> {trans.trending}
                            </div>
                            <div className="p-4 space-y-3">
                                {getTrendingPosts().map((post) => (
                                    <Link key={post.id} href={`/blog/${post.slug}`}>
                                        <div className={`p-3 rounded-lg transition cursor-pointer group ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                                            <h4 className={`text-sm font-semibold line-clamp-2 mb-1 group-hover:text-red-400 transition ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                {getPostTitle(post)}
                                            </h4>
                                            <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                                                <Eye size={12} /> {getViewCount(post)} views
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Featured Post */}
                        {featuredPost && (
                            <Link href={`/blog/${featuredPost.slug}`}>
                                <div className={`group rounded-lg overflow-hidden border transition cursor-pointer ${isDark ? 'border-slate-700 hover:border-cyan-500/50' : 'border-slate-200 hover:border-blue-300'}`}>
                                    {featuredPost.featured_image_url && (
                                        <div className="relative w-full h-64 md:h-80 overflow-hidden">
                                            <Image
                                                src={featuredPost.featured_image_url}
                                                alt={getPostTitle(featuredPost)}
                                                fill
                                                priority
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                                <div className="p-6 w-full">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'}`}>
                                                        {trans.featured}
                                                    </span>
                                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2 line-clamp-2">
                                                        {getPostTitle(featuredPost)}
                                                    </h2>
                                                    <div
                                                        className="blog-excerpt blog-excerpt-light text-white/80 text-sm line-clamp-2"
                                                        dangerouslySetInnerHTML={{ __html: getPostExcerptHtml(featuredPost) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )}

                        {/* Category Filter */}
                        {/*<div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${selectedCategory === 'all'
                                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-blue-100 text-blue-700 border-blue-300'
                                    : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                {trans.allCategories}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border flex items-center gap-2 ${selectedCategory === cat.id
                                        ? isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-blue-100 text-blue-700 border-blue-300'
                                        : isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                >
                                    {hasCategoryIcon(cat) ? (
                                        <span className="text-base leading-none">{cat.icon}</span>
                                    ) : (
                                        <Grid3x3 size={14} />
                                    )}
                                    {getCategoryName(cat)}
                                </button>
                            ))}
                        </div>*/}

                        {/* Posts Grid */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{trans.noArticles}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-6">
                                    {filteredPosts.slice(1).map((post) => (
                                        <Link key={post.id} href={`/blog/${post.slug}`}>
                                            <div className={`group rounded-lg overflow-hidden border transition cursor-pointer flex gap-4 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                                {post.featured_image_url && (
                                                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                                                        <Image
                                                            src={post.featured_image_url}
                                                            alt={getPostTitle(post)}
                                                            fill
                                                            sizes="128px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className={`text-lg font-bold mb-2 line-clamp-2 group-hover:text-cyan-400 transition ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                        {getPostTitle(post)}
                                                    </h3>
                                                    <div
                                                        className={`blog-excerpt text-sm mb-3 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}
                                                        dangerouslySetInnerHTML={{ __html: getPostExcerptHtml(post) }}
                                                    />
                                                    <div className={`flex items-center justify-between text-xs mt-auto pt-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={12} />
                                                            {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                                        </div>
                                                        <div className={`flex items-center gap-1 font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                                                            <Eye size={12} /> {getViewCount(post)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold border transition ${currentPage === pageNumber
                                                    ? isDark
                                                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                                    : isDark
                                                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="space-y-6">
                        {/* Categories Widget */}
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                            <div className={`p-4 flex items-center gap-2 border-b font-bold uppercase text-sm tracking-wider ${isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'}`}>
                                <Tag size={16} /> {trans.categories}
                                <Link
                                    href={`/blog/categories?lang=${language}`}
                                    className={`ml-auto text-xs normal-case font-semibold ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-700'}`}
                                >
                                    All
                                </Link>
                            </div>
                            <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            applyCategoryFilter(cat.id);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between group ${selectedCategory === cat.id
                                            ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-700'
                                            : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-sm flex items-center gap-2">
                                            {hasCategoryIcon(cat) ? <span className="leading-none">{cat.icon}</span> : null}
                                            {getCategoryName(cat)}
                                        </span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tech Spotlight - Mini Stats */}
                        <div className={`rounded-lg p-6 ${isDark ? 'bg-gradient-to-br from-cyan-500/10 to-slate-800 border border-cyan-500/20' : 'bg-gradient-to-br from-blue-50 to-white border border-blue-200'}`}>
                            <h3 className={`font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                                <Flame size={16} /> Quick Stats
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span>Total Articles</span>
                                    <span className="font-bold">{totalPosts}</span>
                                </div>
                                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span>Categories</span>
                                    <span className="font-bold">{categories.length}</span>
                                </div>
                                {featuredPost && (
                                    <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        <span>Top Views</span>
                                        <span className="font-bold">{Math.max(...allPosts.map((p) => getViewCount(p)), 0)}</span>
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
