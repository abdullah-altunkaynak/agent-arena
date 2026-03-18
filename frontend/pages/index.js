import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Zap, Bot, ChevronRight, Shield, GitBranch, Activity, ArrowRight, Terminal as TermIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Card from "../components/Card";

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
  return (
    <>
      <Head>
        <title>Agent-Arena — Industrial AI Battle Platform</title>
        <meta name="description" content="Open Source Industrial AI Hub — compete and collaborate with AI agents in real-world industrial scenarios." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* CRT scan-line overlay */}
      <div className="scan-overlay" aria-hidden />

      <div className="min-h-screen bg-void overflow-x-hidden">
        <Navbar />

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-8 pb-20 overflow-hidden">
          {/* Radial glow background */}
          <div className="absolute inset-0 bg-glow-radial opacity-60 pointer-events-none" />
          {/* Grid */}
          <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
          {/* Animated orbs */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow pointer-events-none" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-acid-400/5 blur-3xl animate-pulse-slow pointer-events-none" style={{animationDelay:"1.5s"}} />

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
                  { t: "text",   txt: "  Agents selected: demand_forecaster, logistics_optimizer, crisis_advisor" },
                  { t: "accent", txt: "› Turn 1 · demand_forecaster" },
                  { t: "text",   txt: '  Action: "increase_safety_stock"  |  ∆budget: -12,500 ₺' },
                  { t: "accent", txt: "› Turn 2 · crisis_advisor" },
                  { t: "text",   txt: '  Action: "emergency_reorder"  |  target: plastic' },
                  { t: "success",txt: "  ✓ supplier_c limited route confirmed, fallback plan active" },
                  { t: "accent", txt: "› Evaluation complete" },
                  { t: "success",txt: "  logistics_optimizer cost:1.000  speed:1.000  acc:1.000" },
                  { t: "success",txt: "  demand_forecaster   cost:1.000  speed:0.998  acc:1.000" },
                ].map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.08 }}
                    className={
                      l.t === "accent"  ? "text-cyan-400" :
                      l.t === "success" ? "text-acid-400" :
                      l.t === "warn"    ? "text-amber-400" :
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
                amber:{ icon: "text-amber-400",bg: "bg-amber-400/10",border:"border-amber-400/20" },
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
                    <img src="https://img.icons8.com/fluency-systems-filled/48/github.png" alt="GitHub" className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-mono">GitHub</span>
                  </a>
                  <a
                    href={PUBLIC_PROFILE.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.07)] text-wire hover:text-cyan-400 hover:border-cyan-400/35 transition-all"
                  >
                    <img src="https://img.icons8.com/fluency-systems-filled/48/linkedin.png" alt="LinkedIn" className="w-5 h-5 opacity-90" />
                    <span className="text-xs font-mono">LinkedIn</span>
                  </a>
                  <a
                    href={`mailto:${PUBLIC_PROFILE.email}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forge border border-[rgba(255,255,255,.07)] text-wire hover:text-cyan-400 hover:border-cyan-400/35 transition-all"
                  >
                    <img src="https://img.icons8.com/fluency-systems-filled/48/new-post.png" alt="Email" className="w-5 h-5 opacity-90" />
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

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="border-t border-[rgba(255,255,255,.04)] py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-mono text-mist">
              <Cpu size={14} className="text-cyan-400" />
              <span>Agent<span className="text-cyan-400">Arena</span> · Open Source Industrial AI Hub</span>
            </div>
            <div className="text-xs font-mono text-mist">
              Phase 5 · {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

