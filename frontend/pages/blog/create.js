/**
 * Create Blog Post Page
 * Form to create new blog posts with image upload
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    ArrowLeft,
    Upload,
    Moon,
    Sun,
    Home,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

export default function CreatePostPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [theme, setThemeLocal] = useState('dark');

    const API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/blog`;

    // State
    const [formData, setFormData] = useState({
        title_tr: '',
        title_en: '',
        excerpt_tr: '',
        excerpt_en: '',
        content_tr: '',
        content_en: '',
        category_id: '',
        featured_image_url: '',
        featured_image_file: null,
        status: 'draft',
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    const isDark = theme === 'dark';

    useEffect(() => {
        setMounted(true);
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setThemeLocal(savedTheme);
        fetchCategories();
    }, []);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('File must be an image');
                return;
            }

            setFormData({ ...formData, featured_image_file: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.title_tr || !formData.content_tr || !formData.category_id) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            // Prepare FormData for multipart upload
            const submitData = new FormData();
            submitData.append('title_tr', formData.title_tr);
            submitData.append('title_en', formData.title_en || formData.title_tr);
            submitData.append('excerpt_tr', formData.excerpt_tr);
            submitData.append('excerpt_en', formData.excerpt_en || formData.excerpt_tr);
            submitData.append('content_tr', formData.content_tr);
            submitData.append('content_en', formData.content_en || formData.content_tr);
            submitData.append('category_id', formData.category_id);
            submitData.append('status', formData.status);

            // Add image if selected
            if (formData.featured_image_file) {
                submitData.append('featured_image', formData.featured_image_file);
            }

            // Submit form
            const response = await fetch(`${API_BASE}/posts`, {
                method: 'POST',
                body: submitData,
                headers: {
                    'X-API-Key': 'super-secret-admin-key-12345',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create post');
            }

            const newPost = await response.json();
            setSuccess('Post created successfully! Redirecting...');

            setTimeout(() => {
                router.push(`/blog/${newPost.slug}`);
            }, 1500);
        } catch (err) {
            console.error('Error creating post:', err);
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <Head>
                <title>Create Post | Agent Arena Blog Admin</title>
                <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
                <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
            </Head>
            <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Navbar */}
                <nav className={`sticky top-0 z-50 border-b ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                <Home size={24} className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
                            </Link>
                            <Link href="/blog" className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                                <ArrowLeft size={20} />
                                Back to Blog
                            </Link>
                        </div>
                        <button
                            onClick={() => {
                                const newTheme = theme === 'dark' ? 'light' : 'dark';
                                setThemeLocal(newTheme);
                                localStorage.setItem('theme', newTheme);
                                if (newTheme === 'dark') {
                                    document.documentElement.classList.add('dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                }
                            }}
                            className={`p-2.5 rounded-lg transition ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className={`${isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700' : 'bg-gradient-to-b from-blue-50 to-white border-b border-slate-200'} py-16 px-4`}>
                    <div className="max-w-6xl mx-auto">
                        <h1 className={`text-4xl md:text-5xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Create New <span className={isDark ? 'text-cyan-400' : 'text-blue-600'}>Article</span>
                        </h1>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Share your insights and knowledge with our community
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                                <CheckCircle size={20} />
                                {success}
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className={`p-8 rounded-lg border-2 border-dashed transition ${isDark ? 'border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                            <div className="flex flex-col items-center gap-4">
                                {imagePreview ? (
                                    <div className="w-full max-w-md">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-64 object-cover rounded-lg"
                                        />
                                        <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                            Click to change image
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={48} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                        <div className="text-center">
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                Drop image here or click to browse
                                            </p>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                PNG, JPG, GIF up to 5MB
                                            </p>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Title Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Title (Turkish) *
                                </label>
                                <input
                                    type="text"
                                    name="title_tr"
                                    value={formData.title_tr}
                                    onChange={handleInputChange}
                                    placeholder="Enter article title in Turkish"
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Title (English)
                                </label>
                                <input
                                    type="text"
                                    name="title_en"
                                    value={formData.title_en}
                                    onChange={handleInputChange}
                                    placeholder="Enter article title in English (optional)"
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                        </div>

                        {/* Excerpt Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Excerpt (Turkish) *
                                </label>
                                <textarea
                                    name="excerpt_tr"
                                    value={formData.excerpt_tr}
                                    onChange={handleInputChange}
                                    placeholder="Short description in Turkish"
                                    rows={3}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Excerpt (English)
                                </label>
                                <textarea
                                    name="excerpt_en"
                                    value={formData.excerpt_en}
                                    onChange={handleInputChange}
                                    placeholder="Short description in English (optional)"
                                    rows={3}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                        </div>

                        {/* Content Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Content (Turkish) * (Markdown)
                                </label>
                                <textarea
                                    name="content_tr"
                                    value={formData.content_tr}
                                    onChange={handleInputChange}
                                    placeholder="Write your article in Markdown format"
                                    rows={10}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none resize-none font-mono text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Content (English) (Markdown)
                                </label>
                                <textarea
                                    name="content_en"
                                    value={formData.content_en}
                                    onChange={handleInputChange}
                                    placeholder="Write your article in English (optional)"
                                    rows={10}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none resize-none font-mono text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-600'}`}
                                />
                            </div>
                        </div>

                        {/* Category & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Category *
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'}`}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'}`}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-3 rounded-lg font-semibold transition flex-1 ${isDark ? 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'}`}
                            >
                                {loading ? 'Creating...' : 'Create Article'}
                            </button>
                            <Link href="/blog">
                                <button
                                    type="button"
                                    className={`px-6 py-3 rounded-lg font-semibold transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
                                >
                                    Cancel
                                </button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
