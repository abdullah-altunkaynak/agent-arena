import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ArrowLeft, Calendar, Newspaper, Eye } from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function TechNewsPage() {
    const router = useRouter();
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [category, setCategory] = useState(null);

    const API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`;
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');
    const isDark = true;
    const isEnglish = language === 'en';

    const normalizeLang = (value) => (value === 'tr' ? 'tr' : 'en');

    const t = useMemo(() => ({
        en: {
            title: 'Tech News',
            subtitle: 'Agent Arena Tech News features the latest news and fantastic articles curated by following the most renowned technology writers.',
            back: 'Back to Blog',
            empty: 'No Tech News posts found yet.',
            readMore: 'Read More',
            views: 'views',
            categoryMissing: 'Tech News category is not available yet.',
        },
        tr: {
            title: 'Teknoloji Haberleri',
            subtitle: 'En güncel haberler, en bilindik teknoloji yazarlarını takip ederek oluşturulan muhteşem yazılar Agent Arena Teknoloji Haberlerinde.',
            back: 'Bloga Don',
            empty: 'Henuz Tech News yazisi bulunamadi.',
            readMore: 'Devamini Oku',
            views: 'goruntulenme',
            categoryMissing: 'Tech News kategorisi henuz bulunamadi.',
        },
    }), []);

    const trans = t[language];

    useEffect(() => {
        if (!router.isReady) return;

        const queryLang = typeof router.query.lang === 'string' ? normalizeLang(router.query.lang) : null;
        const savedLang = normalizeLang(localStorage.getItem('blogLanguage'));
        const selectedLang = queryLang || savedLang;

        // Set HTML lang attribute dynamically
        if (typeof document !== 'undefined') {
            document.documentElement.lang = selectedLang === 'tr' ? 'tr' : 'en';
        }

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

        const fetchTechNews = async () => {
            setLoading(true);
            try {
                const categoryRes = await fetch('/api/blog/categories');
                if (!categoryRes.ok) throw new Error(`Categories request failed with status ${categoryRes.status}`);
                const payload = await categoryRes.json();
                const categoryItems = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.items)
                        ? payload.items
                        : Array.isArray(payload?.categories)
                            ? payload.categories
                            : [];

                const techCategory = categoryItems.find((cat) => {
                    const nameEn = String(cat?.name_en || '').toLowerCase();
                    const nameTr = String(cat?.name_tr || '').toLowerCase();
                    const nameAny = String(cat?.name || '').toLowerCase();
                    return nameEn === 'tech news'
                        || nameTr === 'teknoloji haberleri'
                        || nameAny === 'tech news'
                        || nameAny === 'teknoloji haberleri';
                });

                setCategory(techCategory || null);
                if (!techCategory?.id) {
                    setPosts([]);
                    return;
                }

                const allTechNewsPosts = [];
                let currentPage = 1;
                let totalPages = 1;

                do {
                    const params = new URLSearchParams({
                        status: 'published',
                        category_id: String(techCategory.id),
                        page: String(currentPage),
                        page_size: '100',
                    });

                    const postsRes = await fetch(`${API_BASE}/posts?${params}`);
                    if (!postsRes.ok) throw new Error(`Posts request failed with status ${postsRes.status}`);

                    const postPayload = await postsRes.json();
                    allTechNewsPosts.push(...(postPayload?.items || []));
                    totalPages = Math.max(Number(postPayload?.total_pages || 1), 1);
                    currentPage += 1;
                } while (currentPage <= totalPages);

                allTechNewsPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setPosts(allTechNewsPosts);
            } catch (error) {
                console.error('Failed to load Tech News posts:', error);
                setPosts([]);
                setCategory(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTechNews();
    }, [router.isReady, API_BASE]);

    const getPostTitle = (post) => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostExcerpt = (post) => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const getViewCount = (post) => {
        const raw = post?.view_count ?? post?.views ?? post?.viewCount ?? 0;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const langForSeo = normalizeLang(typeof router.query.lang === 'string' ? router.query.lang : language);
    const canonicalUrl = `${SITE_URL}/blog/tech-news?lang=${langForSeo}`;
    const hreflangTrUrl = `${SITE_URL}/blog/tech-news?lang=tr`;
    const hreflangEnUrl = `${SITE_URL}/blog/tech-news?lang=en`;
    const defaultUrl = `${SITE_URL}/blog/tech-news`;

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
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={trans.title} />
                <meta name="twitter:description" content={trans.subtitle} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={defaultUrl} />
            </Head>

            <Navbar />

            <div className={`pt-24 pb-10 px-4 ${isDark ? 'bg-gradient-to-b from-slate-800/50 to-slate-900 border-b border-slate-700' : 'bg-gradient-to-b from-slate-50 to-white border-b border-slate-200'}`}>
                <div className="max-w-5xl mx-auto">
                    <Link href={`/blog?lang=${language}`} className={`inline-flex items-center gap-2 text-sm font-semibold mb-6 ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-700'}`}>
                        <ArrowLeft size={16} /> {trans.back}
                    </Link>

                    <div className="flex items-center gap-3 mb-2">
                        <Newspaper size={24} className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{trans.title}</h1>
                    </div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{trans.subtitle}</p>
                    {category ? (
                        <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {isEnglish ? `Category: ${category.name_en || category.name_tr || category.name}` : `Kategori: ${category.name_tr || category.name_en || category.name}`}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-cyan-400' : 'border-blue-600'}`}></div>
                    </div>
                ) : !category ? (
                    <div className="text-center py-16">
                        <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{trans.categoryMissing}</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{trans.empty}</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`}>
                                <div className={`group rounded-lg overflow-hidden border transition cursor-pointer flex gap-4 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                    {post.featured_image_url ? (
                                        <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                                            <Image
                                                src={post.featured_image_url}
                                                alt={getPostTitle(post)}
                                                fill
                                                sizes="128px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : null}

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h2 className={`text-lg font-bold mb-2 line-clamp-2 group-hover:text-cyan-400 transition ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            {getPostTitle(post)}
                                        </h2>
                                        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {getPostExcerpt(post)}
                                        </p>

                                        <div className={`flex items-center justify-between text-xs mt-auto pt-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} />
                                                {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1">
                                                    <Eye size={12} /> {getViewCount(post)} {trans.views}
                                                </span>
                                                <span className={`${isDark ? 'text-cyan-400' : 'text-blue-600'} font-semibold`}>
                                                    {trans.readMore}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
