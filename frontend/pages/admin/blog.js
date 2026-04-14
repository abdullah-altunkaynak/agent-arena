/**
 * Blog Admin Dashboard - Main Component
 * Manage blog posts with create, edit, delete, publish functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    Trash2,
    Edit2,
    Plus,
    Search,
    Filter,
    Check,
    X,
    Loader,
    Eye,
    Calendar,
} from 'lucide-react';
import StatWidget from '../../components/StatWidget';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import MarkdownEditor from '../../components/MarkdownEditor';

const BlogAdminDashboard = () => {
    const router = useRouter();
    // API Base URL
    const API_BASE = process.env.NEXT_PUBLIC_BLOG_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'https://api.agentarena.me'}/api/v1/blog`;
    const API_KEY = process.env.NEXT_PUBLIC_BLOG_API_KEY;

    // State Management
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [formData, setFormData] = useState({
        title_tr: '',
        content_tr: '',
        title_en: '',
        content_en: '',
        slug: '',
        excerpt_tr: '',
        excerpt_en: '',
        featured_image_url: '',
        status: 'draft',
    });

    // Fetch posts
    useEffect(() => {
        fetchPosts();
    }, [pagination.page, statusFilter]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: pagination.page,
                page_size: pagination.pageSize,
            });

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`${API_BASE}/posts?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY || 'super-secret-admin-key-12345',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch posts');

            const data = await response.json();
            setPosts(data.items);
            setPagination({
                page: data.page,
                pageSize: data.page_size,
                total: data.total,
                totalPages: data.total_pages,
            });
        } catch (err) {
            setError(err.message);
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and search posts
    useEffect(() => {
        let filtered = posts;

        if (searchTerm) {
            filtered = filtered.filter(
                (post) =>
                    post.title_tr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.title_en?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredPosts(filtered);
    }, [searchTerm, posts]);

    // Reset form
    const resetForm = () => {
        setFormData({
            title_tr: '',
            content_tr: '',
            title_en: '',
            content_en: '',
            slug: '',
            excerpt_tr: '',
            excerpt_en: '',
            featured_image_url: '',
            status: 'draft',
        });
        setEditingPost(null);
    };

    // Open create page (new editor)
    const openCreateModal = () => {
        router.push('/blog/create');
    };

    // Open edit modal
    const openEditModal = (post) => {
        setEditingPost(post);
        setFormData({
            title_tr: post.title_tr,
            content_tr: post.content_tr,
            title_en: post.title_en || '',
            content_en: post.content_en || '',
            slug: post.slug,
            excerpt_tr: post.excerpt_tr || '',
            excerpt_en: post.excerpt_en || '',
            featured_image_url: post.featured_image_url || '',
            status: post.status,
        });
        setShowModal(true);
    };

    // Save post
    const handleSavePost = async () => {
        try {
            if (!formData.title_tr || !formData.slug || !formData.content_tr) {
                setError('Title, slug, and content are required');
                return;
            }

            const endpoint = editingPost
                ? `${API_BASE}/posts/${editingPost.id}`
                : `${API_BASE}/posts`;

            const method = editingPost ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': API_KEY || '',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save post');

            setShowModal(false);
            resetForm();
            await fetchPosts();
        } catch (err) {
            setError(err.message);
            console.error('Error saving post:', err);
        }
    };

    // Publish post
    const handlePublishPost = async (postId) => {
        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': API_KEY || '',
                },
            });

            if (!response.ok) throw new Error('Failed to publish post');

            await fetchPosts();
        } catch (err) {
            setError(err.message);
            console.error('Error publishing post:', err);
        }
    };

    // Delete post
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': API_KEY || '',
                },
            });

            if (!response.ok) throw new Error('Failed to delete post');

            await fetchPosts();
        } catch (err) {
            setError(err.message);
            console.error('Error deleting post:', err);
        }
    };

    // Generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData((prev) => ({
            ...prev,
            title_tr: title,
            slug: generateSlug(title),
        }));
    };

    // Stats
    const stats = [
        {
            label: 'Total Posts',
            value: posts.length,
            icon: '📝',
        },
        {
            label: 'Published',
            value: posts.filter((p) => p.status === 'published').length,
            icon: '✨',
        },
        {
            label: 'Drafts',
            value: posts.filter((p) => p.status === 'draft').length,
            icon: '📋',
        },
        {
            label: 'Total Views',
            value: posts.reduce((sum, p) => sum + (p.view_count || 0), 0),
            icon: '👁️',
        },
    ];

    if (loading && posts.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Blog Admin Dashboard | Agent Arena</title>
                <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
                <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                        Blog Admin Dashboard
                    </h1>
                    <p className="text-slate-400">Manage your blog posts and content</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
                        <p className="font-semibold">Error: {error}</p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, idx) => (
                        <StatWidget
                            key={idx}
                            label={stat.label}
                            value={stat.value}
                            trend={idx % 2 === 0 ? 'up' : 'stable'}
                        />
                    ))}
                </div>

                {/* Controls */}
                <Card className="mb-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination((prev) => ({ ...prev, page: 1 }));
                                }}
                                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        {/* Create Button */}
                        <Link href="/blog/create">
                            <Button className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                New Post
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Posts Table */}
                <Card>
                    <div className="overflow-x-auto">
                        {filteredPosts.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-700">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-slate-300">
                                            Title
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-slate-300">
                                            Slug
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-slate-300">
                                            Status
                                        </th>
                                        <th className="text-center py-4 px-6 font-semibold text-slate-300">
                                            Views
                                        </th>
                                        <th className="text-left py-4 px-6 font-semibold text-slate-300">
                                            Created
                                        </th>
                                        <th className="text-right py-4 px-6 font-semibold text-slate-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {filteredPosts.map((post) => (
                                        <tr
                                            key={post.id}
                                            className="hover:bg-slate-700 hover:bg-opacity-50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="font-medium text-white">{post.title_tr}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {post.title_en || 'No English title'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <code className="text-xs bg-slate-700 px-2 py-1 rounded text-cyan-300">
                                                    {post.slug}
                                                </code>
                                            </td>
                                            <td className="py-4 px-6">
                                                <StatusBadge status={post.status} />
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    <span className="font-semibold">{post.view_count || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(post.created_at).toLocaleDateString('tr-TR')}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {post.status === 'draft' && (
                                                        <button
                                                            onClick={() => handlePublishPost(post.id)}
                                                            className="p-2 hover:bg-green-500 hover:bg-opacity-20 rounded text-green-400 transition-colors"
                                                            title="Publish"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(post)}
                                                        className="p-2 hover:bg-blue-500 hover:bg-opacity-20 rounded text-blue-400 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-slate-400">No posts found. Create your first post!</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {filteredPosts.length > 0 && (
                        <div className="border-t border-slate-700 p-4 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                                {pagination.total} posts
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                                    }
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 bg-slate-700 rounded text-white disabled:opacity-50 hover:bg-slate-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({
                                            ...prev,
                                            page: Math.min(prev.totalPages, prev.page + 1),
                                        }))
                                    }
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="px-4 py-2 bg-slate-700 rounded text-white disabled:opacity-50 hover:bg-slate-600 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {editingPost ? 'Edit Post' : 'Create New Post'}
                    </h2>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                        {/* Turkish Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Title (Turkish) *
                            </label>
                            <input
                                type="text"
                                value={formData.title_tr}
                                onChange={handleTitleChange}
                                placeholder="Enter Turkish title"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* Turkish Content */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Content (Turkish - Markdown) *
                            </label>
                            <textarea
                                value={formData.content_tr}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, content_tr: e.target.value }))
                                }
                                placeholder="Enter Turkish content (supports Markdown)"
                                rows="6"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 font-mono text-sm"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Slug (URL) *
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                                    }))
                                }
                                placeholder="auto-generated-from-title"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 font-mono text-sm"
                            />
                            <p className="text-xs text-slate-400 mt-1">URL: /blog/{formData.slug}</p>
                        </div>

                        {/* Excerpt TR */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Excerpt (Turkish)
                            </label>
                            <textarea
                                value={formData.excerpt_tr}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, excerpt_tr: e.target.value }))
                                }
                                placeholder="Brief summary of the post"
                                rows="2"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* English Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Title (English)
                            </label>
                            <input
                                type="text"
                                value={formData.title_en}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, title_en: e.target.value }))
                                }
                                placeholder="Enter English title (optional)"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* English Content */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Content (English - Markdown)
                            </label>
                            <textarea
                                value={formData.content_en}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, content_en: e.target.value }))
                                }
                                placeholder="Enter English content (supports Markdown)"
                                rows="6"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 font-mono text-sm"
                            />
                        </div>

                        {/* Excerpt EN */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Excerpt (English)
                            </label>
                            <textarea
                                value={formData.excerpt_en}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, excerpt_en: e.target.value }))
                                }
                                placeholder="Brief summary of the post"
                                rows="2"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* Featured Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Featured Image URL
                            </label>
                            <input
                                type="url"
                                value={formData.featured_image_url}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        featured_image_url: e.target.value,
                                    }))
                                }
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, status: e.target.value }))
                                    }
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button onClick={handleSavePost}>
                            {editingPost ? 'Update Post' : 'Create Post'}
                        </Button>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default BlogAdminDashboard;
