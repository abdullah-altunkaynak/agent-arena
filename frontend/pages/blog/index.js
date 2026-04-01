import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    Search,
    Eye,
    Calendar,
    Tag,
    Flame,
    TrendingUp,
    Clock,
    Home,
    ChevronRight,
    Grid3x3,
} from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function BlogPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [language, setLanguage] = useState('en');
    const API_BASE = process.env.NEXT_PUBLIC_API_URL + '/api/v1/blog';

    const [featuredPost, setFeaturedPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTag, setSelectedTag] = useState('all');
    const [filteredPosts, setFilteredPosts] = useState([]);

    const isDark = true;
    const isEnglish = language === 'en';

    // i18n strings
    const t = {
        en: {
            insights: 'Insights',
            articles: 'Articles',
            subtitle: 'Explore the latest developments in AI, automation, and industrial innovation',
            search: 'Search articles...',
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
            search: 'Makalelerle ara...',
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
        setMounted(true);
        const savedLang = localStorage.getItem('blogLanguage') || 'en';
        setLanguage(savedLang);
    }, []);

    // Fetch posts and categories when component mounts
    useEffect(() => {
        if (mounted) {
            const fetchData = async () => {
                await fetchPosts();
                await fetchCategories();
            };
            fetchData();
        }
    }, [mounted]);

    const fetchPosts = async () => {
        try {
            const params = new URLSearchParams({
                status: 'published',
                page: 1,
                page_size: 12,
            });

            if (selectedCategory !== 'all') {
                params.append('category_id', selectedCategory);
            }

            const response = await fetch(`${API_BASE}/posts?${params}`);
            const data = await response.json();
            setPosts(data.items || []);

            // Set featured post as first post
            if (data.items && data.items.length > 0) {
                setFeaturedPost(data.items[0]);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            const data = await response.json();
            setCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setCategories([]);
        }
    };

    useEffect(() => {
        let filtered = posts;
        if (searchTerm) {
            const titleField = isEnglish ? 'title_en' : 'title_tr';
            const excerptField = isEnglish ? 'excerpt_en' : 'excerpt_tr';
            filtered = filtered.filter((post) =>
                (post[titleField]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (post[excerptField]?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        setFilteredPosts(filtered);
    }, [searchTerm, posts, language]);

    const getTrendingPosts = () => {
        return posts.slice().sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
    };

    const getLatestPosts = () => {
        return posts.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    };

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'tr' : 'en';
        setLanguage(newLang);
        localStorage.setItem('blogLanguage', newLang);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const getPostTitle = (post) => isEnglish ? (post.title_en || post.title_tr) : (post.title_tr || post.title_en);
    const getPostExcerpt = (post) => isEnglish ? (post.excerpt_en || post.excerpt_tr) : (post.excerpt_tr || post.excerpt_en);
    const getCategoryName = (cat) =>
        isEnglish
            ? (cat?.name_en || cat?.name_tr || cat?.name || 'Unnamed')
            : (cat?.name_tr || cat?.name_en || cat?.name || 'Isimsiz');
    const hasCategoryIcon = (cat) => typeof cat?.icon === 'string' && cat.icon.trim().length > 0;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Main Navbar */}
            <Navbar />

            {/* Hero Section */}
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

                    {/* Search */}
                    <div className="relative max-w-2xl">
                        <Search className={`absolute left-4 top-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={20} />
                        <input
                            type="text"
                            placeholder={trans.search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-lg border transition focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'}`}
                        />
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
                                                <Eye size={12} /> {post.view_count} views
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
                                            <img
                                                src={featuredPost.featured_image_url}
                                                alt={getPostTitle(featuredPost)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                                <div className="p-6 w-full">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'}`}>
                                                        {trans.featured}
                                                    </span>
                                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2 line-clamp-2">
                                                        {getPostTitle(featuredPost)}
                                                    </h2>
                                                    <p className="text-white/80 text-sm line-clamp-2">
                                                        {getPostExcerpt(featuredPost)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )}

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
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
                                    onClick={() => setSelectedCategory(cat.id)}
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
                        </div>

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
                            <div className="grid gap-6">
                                {filteredPosts.slice(1).map((post) => (
                                    <Link key={post.id} href={`/blog/${post.slug}`}>
                                        <div className={`group rounded-lg overflow-hidden border transition cursor-pointer flex gap-4 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                            {post.featured_image_url && (
                                                <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
                                                    <img
                                                        src={post.featured_image_url}
                                                        alt={getPostTitle(post)}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className={`text-lg font-bold mb-2 line-clamp-2 group-hover:text-cyan-400 transition ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                    {getPostTitle(post)}
                                                </h3>
                                                <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                                    {getPostExcerpt(post)}
                                                </p>
                                                <div className={`flex items-center justify-between text-xs mt-auto pt-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        {new Date(post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'tr-TR')}
                                                    </div>
                                                    <div className={`flex items-center gap-1 font-semibold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                                                        <Eye size={12} /> {post.view_count}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="space-y-6">
                        {/* Categories Widget */}
                        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                            <div className={`p-4 flex items-center gap-2 border-b font-bold uppercase text-sm tracking-wider ${isDark ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-white border-slate-200 text-blue-600'}`}>
                                <Tag size={16} /> {trans.categories}
                            </div>
                            <div className="p-4 space-y-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
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
                                    <span className="font-bold">{posts.length}</span>
                                </div>
                                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span>Categories</span>
                                    <span className="font-bold">{categories.length}</span>
                                </div>
                                {featuredPost && (
                                    <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        <span>Top Views</span>
                                        <span className="font-bold">{Math.max(...posts.map(p => p.view_count || 0))}</span>
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
