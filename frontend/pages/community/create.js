import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import GlobalCommunitySidebar from '@/components/community/GlobalCommunitySidebar';
import { communityAPI } from '@/lib/communityAPI';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = String(reader.result || '');
        const parts = result.split(',');
        resolve(parts.length > 1 ? parts[1] : '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const validateImageFile = (file, label) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        throw new Error(`${label} must be an image file.`);
    }

    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`${label} must be smaller than 2MB.`);
    }
};

export default function CreateCommunityPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [iconFile, setIconFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const iconPreview = useMemo(() => (iconFile ? URL.createObjectURL(iconFile) : ''), [iconFile]);
    const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : ''), [bannerFile]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (name.trim().length < 2) {
            setError('Community name must be at least 2 characters.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            validateImageFile(iconFile, 'Icon');
            validateImageFile(bannerFile, 'Cover');

            const createdCommunity = await communityAPI.createCommunity({
                name: name.trim(),
                description: description.trim() || null,
                isPublic,
                iconFileBase64: iconFile ? await fileToBase64(iconFile) : null,
                iconFileMime: iconFile?.type || null,
                bannerFileBase64: bannerFile ? await fileToBase64(bannerFile) : null,
                bannerFileMime: bannerFile?.type || null,
            });

            if (!createdCommunity?.id) {
                throw new Error('Community created but no id returned.');
            }

            await router.push(`/community/${createdCommunity.id}`);
        } catch (submitError) {
            setError(submitError.message || 'Failed to create community');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Create Community - Agent Arena</title>
                <meta name="description" content="Create a new Agent Arena community with uploaded cover and icon" />
            </Head>

            <Navbar />
            <GlobalCommunitySidebar />

            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 lg:pl-24">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-6 inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    <Card className="border-slate-700 p-6 sm:p-8">
                        <h1 className="mb-2 text-3xl font-bold text-white">Create Community</h1>
                        <p className="mb-6 text-sm text-slate-400">
                            Upload icon and cover images directly. Files are stored in the database.
                        </p>

                        {error ? (
                            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                                {error}
                            </div>
                        ) : null}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-300">Community Name</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    maxLength={255}
                                    placeholder="Agent Builders Hub"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-300">Description</span>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Share what members can discuss in this community..."
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                                />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-300">Icon Upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setIconFile(event.target.files?.[0] || null)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                                    />
                                    <span className="mt-1 block text-xs text-slate-500">PNG, JPG, SVG, WebP. Max 2MB.</span>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-slate-300">Cover Upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                                    />
                                    <span className="mt-1 block text-xs text-slate-500">Recommended cover ratio: 3:1. Max 2MB.</span>
                                </label>
                            </div>

                            <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(event) => setIsPublic(event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                                />
                                Public community
                            </label>

                            {(iconPreview || bannerPreview) ? (
                                <div className="rounded-lg border border-cyan-400/20 bg-slate-900/70 p-4">
                                    <p className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
                                        <ImageIcon size={14} />
                                        Appearance Preview
                                    </p>
                                    <div className="space-y-3">
                                        {bannerPreview ? (
                                            <img src={bannerPreview} alt="Cover preview" className="h-28 w-full rounded-lg object-cover" />
                                        ) : null}
                                        {iconPreview ? (
                                            <img src={iconPreview} alt="Icon preview" className="h-16 w-16 rounded-xl object-cover" />
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            <Button
                                type="submit"
                                disabled={submitting}
                                className={submitting ? 'w-full cursor-not-allowed bg-slate-700 opacity-60' : 'w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400'}
                            >
                                {submitting ? 'Creating Community...' : 'Create Community'}
                            </Button>
                        </form>
                    </Card>
                </div>
            </main>

            <Footer />
        </>
    );
}
