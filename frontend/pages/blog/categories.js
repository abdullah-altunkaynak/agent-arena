import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layers, ArrowLeft, BarChart3 } from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function BlogCategoriesPage() {
    const router = useRouter();
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [categoryStats, setCategoryStats] = useState([]);

    const API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`;
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');
    const isDark = true;
    const isEnglish = language === 'en';
    const normalizeLang = (value) => (value === 'tr' ? 'tr' : 'en');

    const t = useMemo(() => ({
        en: {
            title: 'Categories',
            subtitle: 'Top categories ranked by number of published posts',
            posts: 'posts',
            empty: 'No categories found',
            back: 'Back to Blog',
        },
        tr: {
            title: 'Kategoriler',
            subtitle: 'Yayınlanmış yazı sayısına göre en yüksekten düşüğe sıralama',
            posts: 'yazı',
            empty: 'Kategori bulunamadı',
            back: 'Bloga Dön',
        },
    }), []);

    const trans = t[language];

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

    useEffect(() => {
        if (!router.isReady) return;

        const fetchCategoryData = async () => {
            setLoading(true);
            try {
                const categoryRes = await fetch('/api/blog/categories');
                if (!categoryRes.ok) {
                    throw new Error(`Categories request failed with status ${categoryRes.status}`);
                }

                const payload = await categoryRes.json();
                const categoryItems = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.items)
                        ? payload.items
                        : Array.isArray(payload?.categories)
                            ? payload.categories
                            : [];

                const allPublishedPosts = [];
                let currentPage = 1;
                let totalPages = 1;

                do {
                    const params = new URLSearchParams({
                        status: 'published',
                        page: String(currentPage),
                        page_size: '100',
                    });

                    const postRes = await fetch(`${API_BASE}/posts?${params}`);
                    if (!postRes.ok) {
                        throw new Error(`Posts request failed with status ${postRes.status}`);
                    }

                    const postPayload = await postRes.json();
                    allPublishedPosts.push(...(postPayload?.items || []));
                    totalPages = Math.max(Number(postPayload?.total_pages || 1), 1);
                    currentPage += 1;
                } while (currentPage <= totalPages);

                const countByCategoryId = allPublishedPosts.reduce((acc, post) => {
                    const categoryId = post?.category_id;
                    if (!categoryId) return acc;
                    const key = String(categoryId);
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});

                const stats = categoryItems.map((cat) => ({
                    ...cat,
                    postCount: Number(countByCategoryId[String(cat.id)] || 0),
                }));

                stats.sort((a, b) => b.postCount - a.postCount);
                setCategoryStats(stats);
            } catch (error) {
                console.error('Failed to load categories page data:', error);
                setCategoryStats([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryData();
    }, [router.isReady, API_BASE]);

    const canonicalUrl = `${SITE_URL}/blog/categories`;
    const hreflangTrUrl = `${SITE_URL}/blog/categories?lang=tr`;
    const hreflangEnUrl = `${SITE_URL}/blog/categories?lang=en`;

    const getCategoryName = (cat) =>
        isEnglish
            ? (cat?.name_en || cat?.name_tr || cat?.name || 'Unnamed')
            : (cat?.name_tr || cat?.name_en || cat?.name || 'Isimsiz');

    const hasCategoryIcon = (cat) => typeof cat?.icon === 'string' && cat.icon.trim().length > 0;

    const goToFilteredBlog = (categoryId) => {
        router.push({
            pathname: '/blog',
            query: {
                lang: language,
                category: categoryId,
            },
        });
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Head>
                <title>{trans.title}</title>
                <meta name="description" content={trans.subtitle} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Agent Arena" />
                <meta property="og:title" content={trans.title} />
                <meta property="og:description" content={trans.subtitle} />
                <meta property="og:url" content={canonicalUrl} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
            </Head>

            <Navbar />

            <div className={`pt-24 pb-10 px-4 ${isDark ? 'bg-gradient-to-b from-slate-800/50 to-slate-900 border-b border-slate-700' : 'bg-gradient-to-b from-slate-50 to-white border-b border-slate-200'}`}>
                <div className="max-w-7xl mx-auto">
                    <Link href={`/blog?lang=${language}`} className={`inline-flex items-center gap-2 text-sm font-semibold mb-6 ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-700'}`}>
                        <ArrowLeft size={16} /> {trans.back}
                    </Link>

                    <div className="flex items-center gap-3 mb-2">
                        <Layers size={24} className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{trans.title}</h1>
                    </div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{trans.subtitle}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-10">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
                    </div>
                ) : categoryStats.length === 0 ? (
                    <div className="text-center py-16">
                        <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{trans.empty}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {categoryStats.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => goToFilteredBlog(cat.id)}
                                className={`aspect-square rounded-xl border p-4 text-left transition group ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                            >
                                <div className="h-full flex flex-col justify-between">
                                    <div>
                                        <div className={`text-xl mb-2 ${isDark ? 'text-cyan-300' : 'text-blue-600'}`}>
                                            {hasCategoryIcon(cat) ? cat.icon : '•'}
                                        </div>
                                        <h3 className={`text-sm font-bold line-clamp-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                            {getCategoryName(cat)}
                                        </h3>
                                    </div>

                                    <div className={`flex items-center justify-between text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        <span className="inline-flex items-center gap-1">
                                            <BarChart3 size={12} />
                                            {cat.postCount}
                                        </span>
                                        <span>{trans.posts}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
