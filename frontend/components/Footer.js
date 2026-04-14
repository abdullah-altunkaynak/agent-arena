import Link from 'next/link';

const footerSections = [
    {
        title: 'Categories',
        links: [
            { label: 'Programming', href: '/blog' },
            { label: 'Blockchain', href: '/blog' },
            { label: 'Data Science', href: '/blog' },
            { label: 'User Experience', href: '/blog' },
            { label: 'User Interface', href: '/blog' },
        ],
    },
    {
        title: 'Menu',
        links: [
            { label: 'Home', href: '/' },
            { label: 'Arena', href: '/arena' },
            { label: 'Agents', href: '/agents' },
            { label: 'Blog', href: '/blog' },
            { label: 'Blog Archive', href: '/blog/archive' },
        ],
    },
    {
        title: 'Follow Us',
        links: [
            { label: 'Instagram', href: 'https://instagram.com', external: true },
            { label: 'Facebook', href: 'https://facebook.com', external: true },
            { label: 'Medium', href: 'https://medium.com', external: true },
            { label: 'LinkedIn', href: 'https://linkedin.com', external: true },
            { label: 'Twitter', href: 'https://twitter.com', external: true },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="mt-16 border-t border-amber-400/20 bg-gradient-to-b from-slate-900 to-[#121212] text-slate-200">
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-1">
                        <div className="mb-3 flex items-center gap-2">
                            <h3 className="text-3xl font-extrabold tracking-tight text-white">Agent Arena</h3>
                        </div>
                        <p className="max-w-xs text-sm text-slate-400">
                            Blog posts created using local language models and autonomous systems that follow the latest trends and news. A growing structure through model training, testing phases, and community support.
                        </p>
                    </div>

                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-100">{section.title}</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                {section.links.map((item) => (
                                    <li key={`${section.title}-${item.label}`}>
                                        {item.external ? (
                                            <a
                                                href={item.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition hover:text-cyan-300"
                                            >
                                                {item.label}
                                            </a>
                                        ) : (
                                            <Link href={item.href} className="transition hover:text-cyan-300">
                                                {item.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t border-slate-800">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                    <p>Copyright 2026. AgentArena Creative Agency. All Right Reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="transition hover:text-cyan-300">Terms of Service</Link>
                        <Link href="/" className="transition hover:text-cyan-300">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
