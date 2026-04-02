import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bot, Cpu, Zap, Globe, Database, BookOpen,
  FileText, HardDrive, CheckCircle, AlertTriangle, XCircle,
  Code, Shield, Package, User, Tag, Wrench,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";
import Terminal from "../../components/Terminal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.agentarena.me";

const typeIcon = {
  lightweight: Zap,
  api_powered: Globe,
  heavyweight: Cpu,
};

const typeColor = {
  lightweight: "text-acid",
  api_powered: "text-cyan-400",
  heavyweight: "text-amber-400",
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

export default function AgentProfile() {
  const router = useRouter();
  const { slug } = router.query;
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/api/agents/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Agent not found (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setAgent(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-void pt-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-wire/50">
            <Cpu size={32} className="animate-spin" />
            <span className="font-mono text-sm">Loading agent profile…</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !agent) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-void pt-24 flex items-center justify-center">
          <Card className="max-w-md text-center p-8">
            <XCircle size={40} className="mx-auto mb-4 text-rose-500" />
            <h2 className="text-lg font-semibold text-mist mb-2">Agent Not Found</h2>
            <p className="text-wire/60 text-sm mb-6">{error || "Unknown error"}</p>
            <Link href="/agents">
              <Button variant="secondary"><ArrowLeft size={14} /> Back to Agents</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  const cfg = agent.config;
  const TypeIcon = typeIcon[cfg.agent_type] || Bot;
  const v = agent.validation;

  return (
    <>
      <Head>
        <title>{cfg.name} — Agent Arena</title>
      </Head>
      <Navbar />

      <main className="min-h-screen bg-void pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <motion.div variants={fade} initial="hidden" animate="show" custom={0}>
            <Link href="/agents" className="inline-flex items-center gap-2 text-xs font-mono text-wire/50 hover:text-cyan-400 transition mb-6">
              <ArrowLeft size={14} /> All Agents
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div variants={fade} initial="hidden" animate="show" custom={1}
            className="flex flex-col sm:flex-row items-start gap-5 mb-10"
          >
            <div className="w-14 h-14 rounded-xl bg-forge border border-white/5 flex items-center justify-center shrink-0">
              <TypeIcon size={28} className={typeColor[cfg.agent_type] || "text-wire"} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-mist tracking-tight">{cfg.name}</h1>
              <p className="text-wire/60 text-sm mt-1 max-w-2xl">{cfg.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <StatusBadge color={cfg.agent_type === "lightweight" ? "green" : cfg.agent_type === "api_powered" ? "cyan" : "amber"}>
                  {cfg.agent_type}
                </StatusBadge>
                {v.valid ? (
                  <StatusBadge color="green">Valid</StatusBadge>
                ) : (
                  <StatusBadge color="red">Invalid</StatusBadge>
                )}
                {cfg.version && <StatusBadge color="gray">v{cfg.version}</StatusBadge>}
              </div>
            </div>
          </motion.div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Logic Explanation */}
              {agent.logic_explanation && (
                <motion.div variants={fade} initial="hidden" animate="show" custom={2}>
                  <Card className="p-6">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-mist mb-4">
                      <BookOpen size={16} className="text-cyan-400" /> Logic Explanation
                    </h2>
                    <div className="prose prose-invert prose-sm max-w-none
                      text-wire/80 leading-relaxed font-mono text-xs whitespace-pre-wrap
                      [&_h1]:text-mist [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2
                      [&_h2]:text-mist [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4
                      [&_h3]:text-mist/80 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mb-1
                      [&_code]:text-cyan-400 [&_code]:bg-void/50 [&_code]:px-1 [&_code]:rounded
                      [&_strong]:text-mist [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
                    ">
                      {agent.logic_explanation}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* System Prompt */}
              {cfg.system_prompt && (
                <motion.div variants={fade} initial="hidden" animate="show" custom={3}>
                  <Card className="p-6">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-mist mb-4">
                      <Code size={16} className="text-acid" /> System Prompt
                    </h2>
                    <Terminal lines={[cfg.system_prompt]} maxHeight="160px" />
                  </Card>
                </motion.div>
              )}

              {/* Validation */}
              <motion.div variants={fade} initial="hidden" animate="show" custom={4}>
                <Card className="p-6">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-mist mb-4">
                    <Shield size={16} className={v.valid ? "text-emerald-400" : "text-rose-400"} /> Validation
                  </h2>
                  {v.valid && v.errors.length === 0 && v.warnings.length === 0 && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle size={16} /> All checks passed
                    </div>
                  )}
                  {v.errors.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {v.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-rose-400 text-xs font-mono">
                          <XCircle size={14} className="shrink-0 mt-0.5" /> {e}
                        </div>
                      ))}
                    </div>
                  )}
                  {v.warnings.length > 0 && (
                    <div className="space-y-1">
                      {v.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-amber-400 text-xs font-mono">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Right column — meta sidebar */}
            <div className="space-y-6">
              {/* Meta info */}
              <motion.div variants={fade} initial="hidden" animate="show" custom={2}>
                <Card className="p-5 space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-wire/40">Details</h3>
                  <InfoRow icon={User} label="Author" value={cfg.author || "—"} />
                  <InfoRow icon={Tag} label="Version" value={cfg.version || "—"} />
                  <InfoRow icon={Cpu} label="Type" value={cfg.agent_type} />
                  {cfg.inference && (
                    <InfoRow icon={Globe} label="Backend" value={cfg.inference.backend} />
                  )}
                  {cfg.model?.framework && (
                    <InfoRow icon={Package} label="Framework" value={cfg.model.framework} />
                  )}
                </Card>
              </motion.div>

              {/* Tools */}
              {cfg.tools && cfg.tools.length > 0 && (
                <motion.div variants={fade} initial="hidden" animate="show" custom={3}>
                  <Card className="p-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-wire/40 mb-3">Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {cfg.tools.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-void text-xs font-mono text-cyan-400 border border-cyan-400/10">
                          <Wrench size={10} /> {t}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Training Files */}
              {agent.training_files.length > 0 && (
                <motion.div variants={fade} initial="hidden" animate="show" custom={4}>
                  <Card className="p-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-wire/40 mb-3">Training</h3>
                    <ul className="space-y-1">
                      {agent.training_files.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs font-mono text-wire/70">
                          <FileText size={12} className="text-acid shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Data Sample */}
              {agent.data_sample.files.length > 0 && (
                <motion.div variants={fade} initial="hidden" animate="show" custom={5}>
                  <Card className="p-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-wire/40 mb-3">Data Samples</h3>
                    <ul className="space-y-1">
                      {agent.data_sample.files.map((f) => (
                        <li key={f.name} className="flex items-center justify-between text-xs font-mono text-wire/70">
                          <span className="flex items-center gap-2">
                            <Database size={12} className="text-cyan-400 shrink-0" /> {f.name}
                          </span>
                          <span className="text-wire/30">{(f.size_bytes / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}
                    </ul>
                    {agent.data_sample.readme && (
                      <p className="mt-3 text-[11px] text-wire/40 leading-relaxed whitespace-pre-wrap">
                        {agent.data_sample.readme}
                      </p>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Weights */}
              <motion.div variants={fade} initial="hidden" animate="show" custom={6}>
                <Card className="p-5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-wire/40 mb-3">Weights</h3>
                  {agent.weights.has_weights ? (
                    <ul className="space-y-1">
                      {agent.weights.files.map((f) => (
                        <li key={f.name} className="flex items-center justify-between text-xs font-mono text-wire/70">
                          <span className="flex items-center gap-2">
                            <HardDrive size={12} className="text-amber-400 shrink-0" /> {f.name}
                          </span>
                          <span className="text-wire/30">{(f.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-wire/40 font-mono">No weights uploaded yet.</p>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-wire/50">
        <Icon size={13} /> {label}
      </span>
      <span className="font-mono text-mist/80">{value}</span>
    </div>
  );
}
