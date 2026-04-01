/**
 * Markdown Editor Component
 * Simple text editor with Markdown support
 */

import React, { useState } from 'react';
import { Eye, Code } from 'lucide-react';

const MarkdownEditor = ({ value, onChange, placeholder = 'Enter markdown content...' }) => {
    const [preview, setPreview] = useState(false);

    const insertMarkdown = (before, after = '') => {
        const textarea = document.getElementById('markdown-input');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.substring(start, end);

        const newValue =
            value.substring(0, start) +
            before +
            selected +
            after +
            value.substring(end);

        onChange({ target: { value: newValue } });
    };

    return (
        <div className="border border-slate-600 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-slate-700 border-b border-slate-600 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                    title="Toggle preview"
                >
                    {preview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {preview ? 'Edit' : 'Preview'}
                </button>

                <div className="w-px h-6 bg-slate-600" />

                <button
                    type="button"
                    onClick={() => insertMarkdown('# ', '')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-bold transition-colors"
                    title="Heading 1"
                >
                    H1
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('## ', '')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-bold transition-colors"
                    title="Heading 2"
                >
                    H2
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-bold transition-colors"
                    title="Bold"
                >
                    B
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm italic transition-colors"
                    title="Italic"
                >
                    I
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('- ')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                    title="Bullet list"
                >
                    • List
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('[', '](url)')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
                    title="Link"
                >
                    🔗 Link
                </button>

                <button
                    type="button"
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-mono transition-colors"
                    title="Code block"
                >
                    {'<>'}
                </button>
            </div>

            {/* Editor/Preview Area */}
            {preview ? (
                <div className="p-4 bg-slate-800 prose prose-invert max-w-none min-h-64 overflow-auto text-slate-300">
                    {/* Simple markdown preview - in production, use a library like react-markdown */}
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                        {value || placeholder}
                    </pre>
                </div>
            ) : (
                <textarea
                    id="markdown-input"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-700 text-white placeholder-slate-400 focus:outline-none font-mono text-sm resize-none"
                />
            )}
        </div>
    );
};

export default MarkdownEditor;
