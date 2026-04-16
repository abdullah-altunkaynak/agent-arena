import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, ChevronRight, Newspaper } from 'lucide-react';
import Navbar from '../../components/Navbar';

const BLOG_API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://agentarena.me').replace(/\/$/, '');
const PAGE_SIZE = 100;

export default function BlogArchivePage({ posts = [], page = 1, totalPages = 1, language = 'en' }) {
    const isDark = true;
    const isEnglish = language === 'en';

    const title = isEnglish ? 'All Articles Archive' : 'Tum Yazilar Arsivi';
    const subtitle = isEnglish
        ? 'Browse every published article from newest to oldest.'
        : 'Yayimlanmis tum yazilari yeni tarihten eskiye goz atın.';

    // Set HTML lang attribute dynamically
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language === 'tr' ? 'tr' : 'en';
        }
    }, [language]);

    // Canonical URL: clean, without language parameter
    const canonicalUrl = `${SITE_URL}/blog/archive${page > 1 ? `?page=${page}` : ''}`;
    // hreflang URLs: include language parameter
    const hreflangTrUrl = `${SITE_URL}/blog/archive?lang=tr${page > 1 ? `&page=${page}` : ''}`;
    const hreflangEnUrl = `${SITE_URL}/blog/archive?lang=en${page > 1 ? `&page=${page}` : ''}`;

    const getPostTitle = (post) => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostExcerpt = (post) => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const getViewCount = (post) => Number(post?.view_count ?? post?.views ?? post?.viewCount ?? 0) || 0;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <Head>
                <title>{title}</title>
                <meta name="description" content={subtitle} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Agent Arena" />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={subtitle} />
                <meta property="og:url" content={canonicalUrl} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={subtitle} />
                <link rel="canonical" href={canonicalUrl} />
                <link rel="alternate" hrefLang="tr" href={hreflangTrUrl} />
                <link rel="alternate" hrefLang="en" href={hreflangEnUrl} />
                <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
            </Head>

            <Navbar />

            <div className={`pt-24 pb-10 px-4 ${isDark ? 'bg-gradient-to-b from-slate-800/50 to-slate-900 border-b border-slate-700' : 'bg-gradient-to-b from-slate-50 to-white border-b border-slate-200'}`}>
                <div className="max-w-7xl mx-auto">
                    <Link href={`/blog?lang=${language}`} className={`inline-flex items-center gap-2 text-sm font-semibold mb-6 ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-blue-600 hover:text-blue-700'}`}>
                        <ArrowLeft size={16} /> {isEnglish ? 'Back to Blog' : 'Bloga Don'}
                    </Link>

                    <div className="flex items-center gap-3 mb-2">
                        <Newspaper size={24} className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
                    </div>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{subtitle}</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className={`mb-8 rounded-2xl border p-5 ${isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-slate-100' : 'bg-blue-50 border-blue-200 text-slate-900'}`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className={`text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                                {isEnglish ? 'Crawlable archive' : 'Tarayiciya Acik arsiv'}
                            </p>
                            <h2 className="text-2xl font-black mb-1">
                                {isEnglish ? 'Every post lives here' : 'Tum yazilar burada'}
                            </h2>
                            <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {isEnglish
                                    ? 'This page links to every published article so search engines can discover them all from one place.'
                                    : 'Bu sayfa tum yayinlanmis yazilari tek yerden baglayarak tarayicilarin hepsini kesfetmesini saglar.'}
                            </p>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'}`}>
                            {page > 1 ? `Page ${page}` : isEnglish ? 'Archive' : 'Arsiv'}
                            <ChevronRight size={16} />
                        </div>
                    </div>
                </div>

                <div className="grid gap-5">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}?lang=${language}`}>
                            <article className={`group rounded-xl overflow-hidden border transition flex gap-4 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                {post.featured_image_url ? (
                                    <div className="relative w-36 md:w-44 h-32 md:h-36 flex-shrink-0 overflow-hidden">
                                        <Image
                                            src={post.featured_image_url}
                                            alt={getPostTitle(post)}
                                            fill
                                            sizes="(max-width: 640px) 144px, 176px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ) : null}
                                <div className="p-4 md:p-5 flex-1">
                                    <h3 className={`text-lg md:text-xl font-bold mb-2 group-hover:text-cyan-400 transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {getPostTitle(post)}
                                    </h3>
                                    <p className={`text-sm line-clamp-2 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {getPostExcerpt(post)}
                                    </p>
                                    <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} />
                                            {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                        </div>
                                        <span>{getViewCount(post)} views</span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-8">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => {
                            const nextHref = pageNumber === 1
                                ? `/blog/archive?lang=${language}`
                                : `/blog/archive?page=${pageNumber}&lang=${language}`;
                            const active = pageNumber === page;
                            return (
                                <Link
                                    key={pageNumber}
                                    href={nextHref}
                                    className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold border inline-flex items-center justify-center transition ${active
                                        ? isDark
                                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                            : 'bg-blue-100 text-blue-700 border-blue-300'
                                        : isDark
                                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                >
                                    {pageNumber}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export async function getServerSideProps({ query }) {
    const rawPage = Array.isArray(query?.page) ? query.page[0] : query?.page;
    const page = Math.max(parseInt(rawPage || '1', 10) || 1, 1);
    const language = query?.lang === 'tr' ? 'tr' : 'en';

    try {
        const params = new URLSearchParams({
            status: 'published',
            page: String(page),
            page_size: String(PAGE_SIZE),
        });

        const response = await fetch(`${BLOG_API_BASE}/posts?${params}`);
        if (!response.ok) {
            return { props: { posts: [], page, totalPages: 1, language } };
        }

        const data = await response.json();
        const posts = Array.isArray(data?.items) ? data.items : [];
        const totalPages = Math.max(Number(data?.total_pages || 1), 1);

        return { props: { posts, page, totalPages, language } };
    } catch (error) {
        return { props: { posts: [], page, totalPages: 1, language } };
    }
}
