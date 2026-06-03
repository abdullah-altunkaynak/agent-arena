import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Sparkles, Workflow, Smartphone, Globe2 } from "lucide-react";
import Navbar from "../components/Navbar";

const ABOUT_POINTS = [
    {
        icon: Workflow,
        title: "n8n + AI Automation",
        text: "We design local and cloud automation flows to generate, update, and publish content with SEO-aware pipelines.",
    },
    {
        icon: Smartphone,
        title: "Mobile App Development",
        text: "From idea to store release, we build custom mobile apps with optional AI integrations via cloud APIs or on-device local AI.",
    },
    {
        icon: Globe2,
        title: "Growth Infrastructure",
        text: "We connect mobile products with dedicated websites, campaign support, and automated post systems for sustainable growth.",
    },
];

export default function AboutPage() {
    return (
        <>
            <Head>
                <title>About | Agent Arena</title>
                <meta
                    name="description"
                    content="About Agent Arena: AI automation, mobile app development, and growth-focused digital systems."
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <Navbar />

            <div className="min-h-screen bg-void text-wire">
                <section className="relative px-6 pt-28 pb-16 overflow-hidden border-b border-[rgba(255,255,255,.06)]">
                    <div className="absolute inset-0 bg-glow-radial opacity-40 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                    <div className="max-w-5xl mx-auto relative z-10">
                        <p className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4">
                            <Sparkles size={14} />
                            About Agent Arena
                        </p>
                        <h1 className="font-display font-bold text-4xl md:text-6xl text-spark leading-tight mb-6">
                            AI ile çalışan dijital ürünler,
                            <span className="block text-cyan-300">uçtan uca kurulum ve büyüme desteği</span>
                        </h1>
                        <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
                            Agent Arena, otomasyon odaklı içerik sistemleri, AI destekli mobil uygulamalar ve bu ürünleri büyüten web altyapıları kurar.
                            İş modelinize göre tamamen özelleştirilen teknik mimariler geliştiriyoruz.
                        </p>
                    </div>
                </section>

                <section className="px-6 py-14">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
                        {ABOUT_POINTS.map(({ icon: Icon, title, text }) => (
                            <article
                                key={title}
                                className="rounded-2xl border border-[rgba(255,255,255,.08)] bg-forge/60 p-6 hover:border-cyan-400/35 transition-all"
                            >
                                <div className="w-11 h-11 rounded-xl bg-cyan-400/12 border border-cyan-400/30 flex items-center justify-center mb-4">
                                    <Icon size={20} className="text-cyan-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-spark mb-2">{title}</h2>
                                <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="px-6 pb-20">
                    <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-10 glass border border-[rgba(34,211,238,.2)]">
                        <h2 className="font-display text-2xl md:text-3xl text-spark font-bold mb-4">Let us build your next system</h2>
                        <p className="text-slate-300 leading-relaxed mb-6">
                            İster içerik otomasyonu, ister mobil uygulama, ister growth odaklı bir teknik ekosistem hedefleyin; ihtiyaçlarınıza uygun mimariyi birlikte tasarlayabiliriz.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="mailto:abdullah.altunkaynak@outlook.com"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all"
                            >
                                Contact Us
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forge border border-[rgba(255,255,255,.08)] text-wire hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
