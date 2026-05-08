import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const DEFAULT_RULES = [
    'Respect every member and keep feedback constructive.',
    'Stay on-topic and choose the best matching category.',
    'Do not share sensitive credentials or private keys.',
    'Use clear titles and include context when asking questions.',
];

export default function CommunityRulesPanel({
    community,
    rules = DEFAULT_RULES,
    canEditAppearance = false,
    canManageRules = false,
    onSaveAppearance = null,
    onAddRule = null,
    onUpdateRule = null,
    onDeleteRule = null,
}) {
    const [iconFile, setIconFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveError, setSaveError] = useState('');
    const [iconPreview, setIconPreview] = useState(community?.icon_url || '');
    const [bannerPreview, setBannerPreview] = useState(community?.banner_url || '');
    const [newRuleText, setNewRuleText] = useState('');
    const [ruleDrafts, setRuleDrafts] = useState({});
    const iconInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        if (!iconFile) {
            setIconPreview(community?.icon_url || '');
            return undefined;
        }

        const reader = new FileReader();
        reader.onload = () => setIconPreview(String(reader.result || ''));
        reader.readAsDataURL(iconFile);
        return undefined;
    }, [iconFile, community?.icon_url]);

    useEffect(() => {
        if (!bannerFile) {
            setBannerPreview(community?.banner_url || '');
            return undefined;
        }

        const reader = new FileReader();
        reader.onload = () => setBannerPreview(String(reader.result || ''));
        reader.readAsDataURL(bannerFile);
        return undefined;
    }, [bannerFile, community?.banner_url]);

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

    const handleSaveAppearance = async () => {
        if (!onSaveAppearance) return;

        try {
            setSaving(true);
            setSaveError('');
            setSaveMessage('');

            const nextIconFile = iconInputRef.current?.files?.[0] || iconFile;
            const nextBannerFile = bannerInputRef.current?.files?.[0] || bannerFile;

            const payload = {};
            if (nextIconFile) {
                payload.icon_file_base64 = await fileToBase64(nextIconFile);
                payload.icon_file_mime = nextIconFile.type || null;
            }
            if (nextBannerFile) {
                payload.banner_file_base64 = await fileToBase64(nextBannerFile);
                payload.banner_file_mime = nextBannerFile.type || null;
            }

            if (!Object.keys(payload).length) {
                setSaveError('Please select at least one file to upload.');
                return;
            }

            await onSaveAppearance(payload);

            setIconFile(null);
            setBannerFile(null);

            setSaveMessage('Community appearance updated.');
        } catch (error) {
            setSaveError(error.message || 'Failed to update appearance');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRule = async () => {
        if (!onAddRule || !newRuleText.trim()) return;
        try {
            await onAddRule(newRuleText.trim());
            setNewRuleText('');
        } catch (error) {
            setSaveError(error.message || 'Failed to add rule');
        }
    };

    const handleUpdateRule = async (ruleId, fallbackText) => {
        if (!onUpdateRule) return;
        const nextText = (ruleDrafts[ruleId] ?? fallbackText ?? '').trim();
        if (!nextText) return;
        try {
            await onUpdateRule(ruleId, nextText);
        } catch (error) {
            setSaveError(error.message || 'Failed to update rule');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!onDeleteRule) return;
        try {
            await onDeleteRule(ruleId);
        } catch (error) {
            setSaveError(error.message || 'Failed to delete rule');
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <ShieldCheck size={18} className="text-cyan-300" />
                    Community Rules
                </h3>
                <ul className="space-y-3">
                    {rules.map((ruleItem, index) => {
                        const ruleText = typeof ruleItem === 'string' ? ruleItem : ruleItem?.rule_text;
                        const ruleId = typeof ruleItem === 'string' ? `default-${index}` : ruleItem?.id;

                        return (
                            <li key={`${ruleId}-${index}`} className="flex gap-3 text-sm text-slate-300">
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-200">
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    {canManageRules && onUpdateRule ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={ruleDrafts[ruleId] ?? ruleText ?? ''}
                                                onChange={(event) => setRuleDrafts((prev) => ({ ...prev, [ruleId]: event.target.value }))}
                                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateRule(ruleId, ruleText)}
                                                    className="rounded bg-cyan-500 px-2 py-1 text-[10px] font-semibold text-slate-950 hover:bg-cyan-400"
                                                >
                                                    Save
                                                </button>
                                                {!String(ruleId).startsWith('default-') ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRule(ruleId)}
                                                        className="rounded border border-red-400/40 px-2 py-1 text-[10px] font-semibold text-red-200 hover:bg-red-500/10"
                                                    >
                                                        Delete
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <span>{ruleText}</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {canManageRules && onAddRule ? (
                    <div className="mt-4 rounded-md border border-cyan-400/20 bg-slate-900/60 p-2">
                        <p className="mb-2 text-[11px] text-cyan-200">Add New Rule</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newRuleText}
                                onChange={(event) => setNewRuleText(event.target.value)}
                                placeholder="Write a new rule"
                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddRule}
                                className="rounded bg-cyan-500 px-2 py-1 text-[10px] font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <Sparkles size={18} className="text-cyan-300" />
                    Community Profile
                </h3>
                <p className="text-sm text-slate-300">
                    Cover and icon media are now configurable for owner/admin accounts.
                </p>
                <p className="mt-3 text-xs text-cyan-200/90">
                    Owner: {community?.owner_id ? 'Configured' : 'Pending metadata'}
                </p>

                {canEditAppearance ? (
                    <div className="mt-4 space-y-3 rounded-xl border border-cyan-400/20 bg-slate-900/50 p-3">
                        <label className="block text-xs text-slate-300">
                            Icon Upload
                            <input
                                ref={iconInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(event) => setIconFile(event.target.files?.[0] || null)}
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                            />
                        </label>

                        <label className="block text-xs text-slate-300">
                            Cover Upload
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
                                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                            />
                        </label>

                        {(iconPreview || bannerPreview) ? (
                            <div className="rounded-md border border-cyan-400/20 bg-slate-900/60 p-2">
                                {bannerPreview ? (
                                    <img src={bannerPreview} alt="Community cover preview" className="mb-2 h-20 w-full rounded object-cover" />
                                ) : null}
                                {iconPreview ? (
                                    <img src={iconPreview} alt="Community icon preview" className="h-12 w-12 rounded-lg object-cover" />
                                ) : null}
                            </div>
                        ) : null}

                        {saveError ? <p className="text-xs text-red-300">{saveError}</p> : null}
                        {saveMessage ? <p className="text-xs text-cyan-200">{saveMessage}</p> : null}

                        <button
                            type="button"
                            disabled={saving}
                            onClick={handleSaveAppearance}
                            className="w-full rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save Appearance'}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
