import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { Cpu, Zap, Bot, ChevronRight, Shield, GitBranch, Activity, ArrowRight, Smartphone, Cloud, Store, Megaphone, Globe2, Sparkles, Terminal as TermIcon } from "lucide-react";
import { BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Card from "../components/Card";
import AIChatSection from "../components/AIChatSection";

const FEATURES = [
  {
    icon: Zap,
    title: "Live Simulation Engine",
    desc: "Synapse orchestrator runs multi-turn scenarios in real-time. Watch agents compete turn-by-turn with live state updates.",
    color: "cyan",
  },
  {
    icon: Bot,
    title: "BYOK Agent Framework",
    desc: "Bring Your Own Key. Deploy lightweight, API-powered, or heavyweight ML agents with a standardised plug-in interface.",
    color: "acid",
  },
  {
    icon: Shield,
    title: "Industrial Scenarios",
    desc: "Stress-test your AI against Supply Chain Crises, Demand Forecasting spikes, and more adversarial real-world scenarios.",
    color: "amber",
  },
  {
    icon: GitBranch,
    title: "Open Contribution",
    desc: "Fork, extend, and submit agents or scenarios via pull-requests. Community-driven leaderboard keeps the competition fair.",
    color: "cyan",
  },
];

const STATS = [
  { label: "Registered Agents", value: "3", suffix: "" },
  { label: "Active Scenarios", value: "2", suffix: "" },
  { label: "Eval Dimensions", value: "3", suffix: "" },
  { label: "Open Source", value: "100", suffix: "%" },
];

const TECH = ["Next.js", "FastAPI", "Python", "Framer Motion", "Tailwind CSS", "Docker"];

const N8N_TR_FEATURES = [
  "n8n ile akışları dakikalar içinde kurulum",
  "Tam otomatik post üretimi ve planlama",
  "Eski yazılarda SEO puanlama ve iyileştirme",
  "Pexels kaynaklı görsel otomasyonu",
  "Uygun fiyatlı kurulum + isteğe bağlı geliştirme",
];

const N8N_EN_FEATURES = [
  "Spin up n8n workflows in minutes",
  "Fully automated post generation and scheduling",
  "SEO scoring and improvements for legacy posts",
  "Pexels-sourced image automation",
  "Affordable setup with optional custom builds",
];

const MOBILE_TR_FEATURES = [
  "İsteğe özel iOS ve Android mobil uygulama geliştirme",
  "Cloud API ile güçlü yapay zeka entegrasyonu",
  "Kullanıcı cihazında lokal çalışan AI entegrasyonu",
  "Store takipleri, reklam planlama ve yayın desteği",
  "Uygulamaya özel web sitesi + otomatik post sistem bağlantısı",
];

const MOBILE_EN_FEATURES = [
  "Custom iOS and Android app development",
  "Cloud API based AI integration for scalable features",
  "On-device local AI integration on user devices",
  "Store tracking, ad planning, and launch support",
  "Dedicated website + automated post system integration",
];

const MOBILE_TIMELINE = [
  {
    icon: Smartphone,
    trTitle: "Mobil ürün stratejisi ve UX kurgusu",
    enTitle: "Mobile product strategy and UX design",
    trDesc: "Hedef kitleye göre iOS/Android mimarisi, ekran akışları ve ölçeklenebilir ürün planı oluşturuyoruz.",
    enDesc: "We define iOS/Android architecture, screen flows, and a scalable roadmap aligned with your audience.",
    trTag: "Ürün Tasarımı",
    enTag: "Product Design",
  },
  {
    icon: Cloud,
    trTitle: "Cloud API veya lokal AI entegrasyonu",
    enTitle: "Cloud API or on-device AI integration",
    trDesc: "İhtiyaca göre bulut tabanlı LLM API'leri ya da kullanıcı cihazında çalışan lokal AI modellerini entegre ediyoruz.",
    enDesc: "Depending on your needs, we integrate cloud LLM APIs or local on-device AI models running on user hardware.",
    trTag: "AI Katmanı",
    enTag: "AI Layer",
  },
  {
    icon: Store,
    trTitle: "Store yayın ve takip otomasyonu",
    enTitle: "Store launch and monitoring automation",
    trDesc: "App Store ve Google Play süreçlerinde sürüm takibi, metrik izleme ve yayın sonrası optimizasyon desteği sağlıyoruz.",
    enDesc: "We support App Store and Google Play release tracking, KPI monitoring, and post-launch optimization workflows.",
    trTag: "Store Ops",
    enTag: "Store Ops",
  },
  {
    icon: Megaphone,
    trTitle: "Reklam operasyonu ve büyüme kurgusu",
    enTitle: "Ad operations and growth orchestration",
    trDesc: "Kampanya yapıları, kreatif döngüler ve performans odaklı reklam süreçleriyle kullanıcı kazanımını hızlandırıyoruz.",
    enDesc: "We accelerate user acquisition with campaign structures, creative loops, and performance-driven ad operations.",
    trTag: "Growth",
    enTag: "Growth",
  },
  {
    icon: Globe2,
    trTitle: "Özel web sitesi + otomatik post bağlantısı",
    enTitle: "Dedicated website + automated post system",
    trDesc: "Mobil uygulamanıza özel web deneyimi kurup n8n tabanlı otomatik içerik sistemiyle doğrudan bağlıyoruz.",
    enDesc: "We build a dedicated web experience for your app and connect it directly to your n8n-based automated content engine.",
    trTag: "Ecosystem",
    enTag: "Ecosystem",
  },
];

const PUBLIC_PROFILE = {
  github: "https://github.com/abdullah-altunkaynak/agent-arena",
  linkedin: "https://www.linkedin.com/in/abdullah-altunkaynak-51104730b/",
  email: "abdullah.altunkaynak@outlook.com",
};

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Home() {
  const [contentTab, setContentTab] = useState("tr");
  const [mobileTab, setMobileTab] = useState("tr");
  const isTurkish = contentTab === "tr";
  const isMobileTurkish = mobileTab === "tr";

  return (
    <>
      <Head>
        <title>Agent-Arena — Industrial AI Battle Platform</title>
        <meta name="description" content="Open Source Industrial AI Hub — compete and collaborate with AI agents in real-world industrial scenarios." />
        <meta name="keywords" content="Agent Arena, technology, artificial intelligence, AI agent, industrial AI, technology blog, AI blog, agent platform" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-site-verification" content="RXV0o5IkVTPbYR_mAwGsVSJJMQSZFvxUYQ14f86qJv4" />
        <link rel="canonical" href="https://agentarena.me/" />
      </Head>

      {/* CRT scan-line overlay */}
      <div className="scan-overlay" aria-hidden />

      <div className="min-h-screen bg-void overflow-x-hidden">
        <Navbar />

        <AIChatSection />

        {/* ── N8N + AI CONTENT ENGINE ──────────────────────────────── */}
        <section className="relative py-20 px-6 border-b border-[rgba(255,255,255,.05)] overflow-hidden">
          <div className="absolute inset-0 bg-glow-radial opacity-25 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-acid-400/10 blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl mx-auto"
          >
            <div className="rounded-3xl p-8 md:p-10 glass border border-[rgba(34,211,238,.18)] relative">
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-mist">Dil Seçimi</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContentTab("tr")}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${isTurkish
                        ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/50"
                        : "bg-abyss/60 text-mist border-[rgba(255,255,255,.08)] hover:border-cyan-400/30"
                        }`}
                    >
                      TR
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab("en")}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${!isTurkish
                        ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/50"
                        : "bg-abyss/60 text-mist border-[rgba(255,255,255,.08)] hover:border-cyan-400/30"
                        }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr]">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
                        Otomatik İçerik Motoru · Automated Content Engine
                      </p>
                      <h2 className="font-display font-bold text-3xl md:text-4xl text-spark mb-4">
                        {isTurkish
                          ? "n8n + AI ile yerelde, ücretsiz ve tam otomatik içerik üretimi"
                          : "Local, free, and fully automated content production with n8n + AI"}
                        <span className="block text-base md:text-lg text-cyan-200 font-medium mt-2">
                          {isTurkish
                            ? "Local, free, and fully automated content production with n8n + AI"
                            : "n8n + AI ile yerelde, ücretsiz ve tam otomatik içerik üretimi"}
                        </span>
                      </h2>
                      {isTurkish ? (
                        <>
                          <p className="text-wire leading-relaxed mb-5">
                            n8n ve yapay zekayı birleştirerek, lokalde çalışan akışlardan tamamen ücretsiz
                            post üretip paylaşıyoruz. WordPress, özel yazılım backend ya da farklı platformlar
                            fark etmez; aynı akışı birkaç farklı sitede çalıştırabiliyoruz.
                          </p>
                          <p className="text-wire leading-relaxed">
                            Eski yazılara otomatik SEO puanlaması yapıp yazıları güncelliyoruz, Pexels'ten uygun
                            görseller bulup içeriğe ekliyoruz. Sonuç: daha güncel, daha hızlı ve daha etkili
                            içerik.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-wire leading-relaxed mb-5">
                            By combining n8n and AI, we run local workflows that generate and publish posts
                            at no cost. Whether it is WordPress, a custom backend, or another platform, the
                            same flow can run across multiple websites.
                          </p>
                          <p className="text-wire leading-relaxed">
                            We automatically score legacy posts for SEO, refresh the content, and enrich it
                            with images sourced from Pexels. The result is fresher, faster, and higher-performing
                            publishing.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href="https://karshu.blog"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 hover:text-white hover:border-cyan-400/60 transition-all"
                      >
                        {isTurkish ? "Karshu.blog'u ziyaret et" : "Visit karshu.blog"}
                        <ArrowRight size={16} />
                      </a>
                      <a
                        href={`mailto:${PUBLIC_PROFILE.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forge border border-[rgba(255,255,255,.08)] text-wire hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
                      >
                        {isTurkish ? "Ücretsiz danışmanlık al" : "Get free consultation"}
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-mist">
                      {isTurkish ? "Türkçe" : "English"}
                    </p>
                    {(isTurkish ? N8N_TR_FEATURES : N8N_EN_FEATURES).map((item, index) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-start gap-3 rounded-2xl p-4 bg-abyss/70 border border-[rgba(255,255,255,.06)]"
                      >
                        <span
                          className={`mt-1 w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(74,222,128,.6)] ${isTurkish ? "bg-acid-400" : "bg-cyan-400"
                            }`}
                        />
                        <p className="text-sm text-wire leading-relaxed">{item}</p>
                      </motion.div>
                    ))}

                    <div className="rounded-2xl p-4 bg-cyan-400/10 border border-cyan-400/20">
                      {isTurkish ? (
                        <p className="text-sm text-cyan-200 leading-relaxed">
                          Uygun fiyatlarla kurulum yapabilir, ihtiyaca göre akışları özelleştirebiliriz.
                          Ücretsiz danışmanlık için bizimle iletişime geçin.
                        </p>
                      ) : (
                        <p className="text-sm text-cyan-100 leading-relaxed">
                          We can deliver affordable setups and tailor workflows as needed. Reach out for
                          free consultation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── MOBILE APP + AI SYSTEMS ─────────────────────────────── */}
        <section className="relative py-20 px-6 border-b border-[rgba(255,255,255,.05)] overflow-hidden">
          <div className="absolute inset-0 bg-glow-radial opacity-20 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[55rem] h-64 bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-8 w-64 h-64 rounded-full bg-acid-400/10 blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl mx-auto"
          >
            <div className="relative rounded-3xl p-8 md:p-10 border border-[rgba(34,211,238,.2)] glass overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
                      {isMobileTurkish ? "Mobil Ürün Stüdyosu" : "Mobile Product Studio"}
                    </p>
                    <h2 className="font-display font-bold text-3xl md:text-4xl text-spark leading-tight">
                      {isMobileTurkish
                        ? "Fikirden mağaza yayınına tam mobil ürün ekosistemi"
                        : "Full mobile product ecosystem from idea to store launch"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,.09)] bg-abyss/70 p-1">
                    <button
                      type="button"
                      onClick={() => setMobileTab("tr")}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${isMobileTurkish
                          ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/50"
                          : "bg-transparent text-mist border-transparent hover:border-cyan-400/20"
                        }`}
                    >
                      TR
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileTab("en")}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${!isMobileTurkish
                          ? "bg-cyan-400/20 text-cyan-200 border-cyan-400/50"
                          : "bg-transparent text-mist border-transparent hover:border-cyan-400/20"
                        }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
                  <div className="relative pl-8 md:pl-10">
                    <div className="absolute left-3 md:left-4 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/50 via-cyan-400/20 to-transparent" />

                    <div className="space-y-4">
                      {MOBILE_TIMELINE.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <motion.div
                            key={step.enTitle}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08 }}
                            className="relative rounded-2xl p-4 md:p-5 bg-abyss/80 border border-[rgba(255,255,255,.08)]"
                          >
                            <span className="absolute -left-[1.85rem] md:-left-[2.1rem] top-6 w-4 h-4 rounded-full border border-cyan-300/60 bg-cyan-400/20 shadow-[0_0_16px_rgba(34,211,238,.45)]" />
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-xl border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center shrink-0">
                                <Icon size={20} className="text-cyan-300" />
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-cyan-200 bg-cyan-400/10 border border-cyan-400/25 mb-2">
                                  {isMobileTurkish ? step.trTag : step.enTag}
                                </span>
                                <h3 className="text-spark font-semibold text-base md:text-lg mb-1">
                                  {isMobileTurkish ? step.trTitle : step.enTitle}
                                </h3>
                                <p className="text-sm text-wire leading-relaxed">
                                  {isMobileTurkish ? step.trDesc : step.enDesc}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl p-5 border border-[rgba(255,255,255,.08)] bg-gradient-to-br from-cyan-500/10 to-abyss/80">
                      <p className="text-xs font-mono uppercase tracking-widest text-cyan-300 mb-2">
                        {isMobileTurkish ? "Görsel Ürün Kimliği" : "Visual Product Identity"}
                      </p>
                      <h3 className="text-spark text-lg font-semibold mb-2">
                        {isMobileTurkish ? "Uygulama + web + içerik tek büyüme ağında" : "App + web + content in one growth network"}
                      </h3>
                      <p className="text-sm text-wire leading-relaxed">
                        {isMobileTurkish
                          ? "Mobil ürününüzü mağazada görünür kılarken, web sitesi ve otomatik içerik sistemiyle sürekli trafik ve dönüşüm üreten bir yapıya bağlıyoruz."
                          : "We connect your mobile product to a website and automated content engine, creating continuous traffic and conversion loops after launch."}
                      </p>
                    </div>

                    <div className="rounded-2xl p-4 border border-[rgba(255,255,255,.08)] bg-abyss/80">
                      <div className="flex items-center gap-2 text-cyan-300 mb-3">
                        <Sparkles size={16} />
                        <span className="text-xs font-mono uppercase tracking-widest">
                          {isMobileTurkish ? "Hizmet Kapsamı" : "Service Scope"}
                        </span>
                      </div>
                      {(isMobileTurkish ? MOBILE_TR_FEATURES : MOBILE_EN_FEATURES).map((item) => (
                        <div key={item} className="flex items-start gap-2 mb-2 last:mb-0">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-acid-400" />
                          <p className="text-sm text-wire leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <a
                        href={`mailto:${PUBLIC_PROFILE.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all"
                      >
                        {isMobileTurkish ? "Mobil proje için iletişime geç" : "Contact us for your mobile project"}
                        <ArrowRight size={16} />
                      </a>
                      <Link
                        href="/about"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forge border border-[rgba(255,255,255,.08)] text-wire hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
                      >
                        {isMobileTurkish ? "Hakkımızda" : "About us"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-8 pb-20 overflow-hidden">
          {/* Radial glow background */}
          <div className="absolute inset-0 bg-glow-radial opacity-60 pointer-events-none" />
          {/* Grid */}
          <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
          {/* Animated orbs */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow pointer-events-none" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-acid-400/5 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "1.5s" }} />

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col items-center text-center max-w-4xl"
          >
            {/* Version chip */}
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium
                               bg-cyan-400/10 border border-cyan-400/25 text-cyan-400">
                <Activity size={10} className="animate-pulse" />
                v0.2.0 · Phase 5 — 3 Agents · 2 Scenarios
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display font-bold text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] mb-6"
            >
              <span className="text-spark">Industrial</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 neon-text-cyan">
                AI Arena
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-wire max-w-2xl leading-relaxed mb-10"
            >
              An open platform where engineers deploy AI agents to compete in
              <strong className="text-spark"> real-world industrial scenarios</strong>.
              Bring your own key, build your agent, enter the arena.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Link href="/arena">
                <Button size="lg" variant="primary">
                  <Zap size={18} />
                  Enter Arena
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/agents">
                <Button size="lg" variant="secondary">
                  <Bot size={18} />
                  Browse Agents
                </Button>
              </Link>
              <Link href="/blog">
                <Button size="lg" variant="secondary">
                  <BookOpen size={18} />
                  Blog
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: .96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: .7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-16 w-full max-w-2xl"
          >
            <div className="rounded-2xl overflow-hidden border border-[rgba(34,211,238,.15)] shadow-[0_32px_64px_rgba(0,0,0,.6)] glass">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(34,211,238,.1)] bg-void/80">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                <span className="w-3 h-3 rounded-full bg-acid-400/80" />
                <span className="ml-3 text-xs font-mono text-mist tracking-widest">SYNAPSE ENGINE · SIMULATION OUTPUT</span>
                <span className="ml-auto flex items-center gap-1 text-xs font-mono text-acid-400">
                  <Activity size={10} className="animate-pulse" /> LIVE
                </span>
              </div>
              <div className="p-5 font-mono text-xs space-y-1.5 bg-abyss/90">
                {[
                  { t: "accent", txt: "› Scenario loaded: Stock Crisis [stock-crisis-001]" },
                  { t: "text", txt: "  Agents selected: demand_forecaster, logistics_optimizer, crisis_advisor" },
                  { t: "accent", txt: "› Turn 1 · demand_forecaster" },
                  { t: "text", txt: '  Action: "increase_safety_stock"  |  ∆budget: -12,500 ₺' },
                  { t: "accent", txt: "› Turn 2 · crisis_advisor" },
                  { t: "text", txt: '  Action: "emergency_reorder"  |  target: plastic' },
                  { t: "success", txt: "  ✓ supplier_c limited route confirmed, fallback plan active" },
                  { t: "accent", txt: "› Evaluation complete" },
                  { t: "success", txt: "  logistics_optimizer cost:1.000  speed:1.000  acc:1.000" },
                  { t: "success", txt: "  demand_forecaster   cost:1.000  speed:0.998  acc:1.000" },
                ].map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.08 }}
                    className={
                      l.t === "accent" ? "text-cyan-400" :
                        l.t === "success" ? "text-acid-400" :
                          l.t === "warn" ? "text-amber-400" :
                            "text-wire"
                    }
                  >
                    {l.txt}
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.0 }}
                  className="text-mist cursor-blink pt-1"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── STATS BAR ─────────────────────────────────────────────────── */}
        <section className="border-y border-[rgba(34,211,238,.08)] py-8 bg-forge/40 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * .1, duration: .5 }}
                className="text-center"
              >
                <div className="font-display font-bold text-3xl text-cyan-400 neon-text-cyan mb-1">
                  {s.value}<span className="text-xl">{s.suffix}</span>
                </div>
                <div className="text-xs font-mono text-mist uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── SEO COPY ─────────────────────────────────────────────────── */}
        <section className="py-12 px-6 border-b border-[rgba(255,255,255,.04)]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-spark mb-4">
              Agent Arena: an open platform for technology and artificial intelligence
            </h2>
            <p className="text-wire leading-relaxed mb-4">
              Agent Arena is an open-source platform where AI agent performance is tested through real-world industrial scenarios in technology and artificial intelligence.
              On Agent Arena, technology-focused simulations, artificial intelligence competitions, and industrial decision workflows come together in one ecosystem.
              For teams that want to track technology trends, compare AI projects, and accelerate AI agent development, Agent Arena is a practical hub.
            </p>
            <p className="text-wire leading-relaxed">
              To explore the latest technology and artificial intelligence content, visit our
              {" "}
              <Link href="/blog" className="text-cyan-400 hover:text-cyan-300 transition-colors">blog</Link>
              {" "}
              section, and to compare different AI agent profiles, browse the
              {" "}
              <Link href="/agents" className="text-cyan-400 hover:text-cyan-300 transition-colors">agents</Link>
              {" "}
              page.
            </p>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Platform capabilities</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-spark mt-3">
              Built for the fight
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const colorMap = {
                cyan: { icon: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
                acid: { icon: "text-acid-400", bg: "bg-acid-400/10", border: "border-acid-400/20" },
                amber: { icon: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
              };
              const c = colorMap[f.color];
              return (
                <Card key={f.title} delay={i * 0.1} className="p-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${c.bg} border ${c.border}`}>
                    <Icon size={22} className={c.icon} />
                  </div>
                  <h3 className="font-display font-semibold text-spark text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-wire leading-relaxed">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── TECH STACK ────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-[rgba(255,255,255,.04)]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-mono text-mist uppercase tracking-widest mb-6">Built with</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {TECH.map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, scale: .9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * .07 }}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-medium
                             bg-forge border border-[rgba(255,255,255,.06)] text-wire
                             hover:border-cyan-400/30 hover:text-cyan-400 transition-all cursor-default"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* ── REPO + CREATOR ──────────────────────────────────────────── */}
        <section className="py-8 px-6 border-t border-[rgba(255,255,255,.04)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="rounded-2xl p-6 md:p-8 glass border border-[rgba(34,211,238,.18)] relative overflow-hidden">
              <div className="absolute inset-0 bg-glow-radial opacity-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                <div className="flex-1">
                  <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Project Owner</p>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-spark mb-2">
                    Abdullah Altunkaynak
                  </h3>
                  <p className="text-sm text-wire leading-relaxed max-w-xl">
                    Phase 5 now live: 3 agents, 2 scenarios, and an upgraded forecasting model.
                    Explore the repository, connect on LinkedIn, or contact directly for collaborations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                  <a
                    href={PUBLIC_PROFILE.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.07)] text-wire hover:text-cyan-400 hover:border-cyan-400/35 transition-all"
                  >
                    <Image src="https://img.icons8.com/fluency-systems-filled/48/github.png" alt="GitHub" width={20} height={20} unoptimized={true} className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-mono">GitHub</span>
                  </a>
                  <a
                    href={PUBLIC_PROFILE.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.07)] text-wire hover:text-cyan-400 hover:border-cyan-400/35 transition-all"
                  >
                    <Image src="https://img.icons8.com/fluency-systems-filled/48/linkedin.png" alt="LinkedIn" width={20} height={20} unoptimized={true} className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-mono">LinkedIn</span>
                  </a>
                  <a
                    href={`mailto:${PUBLIC_PROFILE.email}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.07)] text-wire hover:text-cyan-400 hover:border-cyan-400/35 transition-all"
                  >
                    <Image src="https://img.icons8.com/fluency-systems-filled/48/new-post.png" alt="Email" width={20} height={20} unoptimized={true} className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-mono">Email</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="relative rounded-2xl p-10 glass border border-[rgba(34,211,238,.15)] overflow-hidden">
              <div className="absolute inset-0 bg-glow-radial opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <Cpu size={40} className="text-cyan-400 mx-auto mb-5 neon-text-cyan animate-float" />
                <h2 className="font-display font-bold text-3xl md:text-4xl text-spark mb-4">
                  Ready to deploy?
                </h2>
                <p className="text-wire mb-8 leading-relaxed">
                  Set your API key, pick a scenario, and let your agents compete in the arena right now.
                </p>
                <Link href="/arena">
                  <Button size="lg" variant="primary">
                    <Zap size={18} />
                    Launch Arena
                    <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

      </div >
    </>
  );
}


