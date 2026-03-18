import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Search, Filter, CheckCircle, Database, BookOpen,
  Beaker, Cpu, ExternalLink, RefreshCw, ChevronRight, ArrowRight,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CONTRIBUTING_GUIDE_URL = "https://github.com/abdullah-altunkaynak/agent-arena/blob/main/docs/CONTRIBUTING.md";

const TYPE_LABELS = {
  lightweight: { label: "Lightweight", color: "acid" },
  api_powered: { label: "API-Powered", color: "cyan" },
  heavyweight: { label: "Heavyweight", color: "amber" },
};

function AgentCard({ agent, delay }) {
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);

  const validate = async () => {
    setValidating(true);
    try {
      const res = await fetch(`${API_URL}/api/agents/${agent.slug}/validate`);
      const data = await res.json();
      setValidation(data);
    } catch {
      setValidation({ valid: false, errors: ["Connection failed"], warnings: [] });
    }
    setValidating(false);
  };

  const typeInfo = TYPE_LABELS[agent.agent_type] || TYPE_LABELS.lightweight;

  return (
    <Card delay={delay} className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-400/5 border border-cyan-400/20
                          flex items-center justify-center text-lg font-display font-bold text-cyan-400">
            {agent.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display font-semibold text-spark text-base leading-tight">
              {agent.name}
            </h2>
            <p className="text-xs text-mist font-mono">{agent.author || "anonymous"}</p>
          </div>
        </div>
        <StatusBadge status={typeInfo.color === "acid" ? "online" : typeInfo.color === "cyan" ? "running" : "limited"} label={typeInfo.label} />
      </div>

      {/* Description */}
      <p className="text-sm text-wire leading-relaxed flex-1">{agent.description}</p>

      {/* Tools */}
      {agent.tools?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.tools.map((t) => (
            <span key={t} className="text-xs font-mono px-2 py-0.5 rounded-md bg-steel border border-[rgba(255,255,255,.05)] text-wire">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Capabilities */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,.04)]">
        {[
          { icon: Database,  label: "Data",     active: agent.has_data_sample },
          { icon: Beaker,    label: "Training",  active: agent.has_training },
          { icon: BookOpen,  label: "Docs",      active: agent.has_logic_explanation },
        ].map(({ icon: Icon, label, active }) => (
          <div key={label} className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1.5 rounded-lg ${
            active ? "bg-acid-400/8 text-acid-400 border border-acid-400/15" : "bg-steel/50 text-mist border border-transparent"
          }`}>
            <Icon size={11} />
            {label}
          </div>
        ))}
      </div>

      {/* Slug */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-mist">slug:</span>
        <span className="text-cyan-400">{agent.slug}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={validate}
          disabled={validating}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium
                     border border-[rgba(255,255,255,.06)] text-wire hover:text-cyan-400 hover:border-cyan-400/25
                     transition-all disabled:opacity-50"
        >
          {validating ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              Validating…
            </>
          ) : (
            <>
              <CheckCircle size={12} />
              Validate
            </>
          )}
        </button>
        <Link
          href={`/agents/${agent.slug}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-medium
                     bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20
                     transition-all"
        >
          <ArrowRight size={12} />
          Profile
        </Link>
      </div>

      {/* Validation result */}
      {validation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`rounded-lg px-4 py-3 text-xs font-mono border ${
            validation.valid
              ? "bg-acid-400/8 border-acid-400/20 text-acid-400"
              : "bg-rose-500/8 border-rose-500/20 text-rose-400"
          }`}
        >
          <p className="font-bold mb-1">{validation.valid ? "✓ Valid" : "✗ Issues found"}</p>
          {validation.errors?.map((e, i) => <p key={i} className="text-rose-400">• {e}</p>)}
          {validation.warnings?.map((w, i) => <p key={i} className="text-amber-400">⚠ {w}</p>)}
        </motion.div>
      )}
    </Card>
  );
}

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/api/agents/`)
      .then((r) => r.json())
      .then((data) => { setAgents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = agents.filter((a) => {
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.agent_type === typeFilter;
    return matchSearch && matchType;
  });

  const typeCounts = {
    all: agents.length,
    lightweight: agents.filter((a) => a.agent_type === "lightweight").length,
    api_powered: agents.filter((a) => a.agent_type === "api_powered").length,
    heavyweight: agents.filter((a) => a.agent_type === "heavyweight").length,
  };

  return (
    <>
      <Head>
        <title>Agents · Agent-Arena</title>
      </Head>

      <div className="scan-overlay" aria-hidden />

      <div className="min-h-screen bg-void">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pb-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 border-b border-[rgba(255,255,255,.04)] mb-8"
          >
            <h1 className="font-display font-bold text-4xl text-spark flex items-center gap-3">
              <Bot size={32} className="text-cyan-400" />
              Agents
            </h1>
            <p className="text-wire mt-1 text-sm">
              {agents.length} agents registered · explore capabilities and run validation checks.
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-forge border border-[rgba(255,255,255,.06)]
                           text-sm text-spark placeholder-mist font-mono
                           focus:outline-none focus:border-cyan-400/40 transition-colors"
              />
            </div>

            {/* Type filter */}
            <div className="flex gap-2">
              {Object.entries(typeCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all border ${
                    typeFilter === type
                      ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-400"
                      : "bg-forge border-[rgba(255,255,255,.06)] text-wire hover:text-spark hover:border-[rgba(255,255,255,.12)]"
                  }`}
                >
                  {type === "all" ? "All" : type.replace("_", " ")}
                  <span className={`ml-1.5 ${typeFilter === type ? "text-cyan-300" : "text-mist"}`}>({count})</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
              <p className="text-mist text-sm font-mono">Loading agents…</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <Bot size={48} className="text-mist mx-auto mb-4 opacity-40" />
              <p className="text-mist font-mono text-sm">
                {search ? `No agents match "${search}"` : "No agents registered yet. Be the first to contribute!"}
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((agent, i) => (
                <AgentCard key={agent.slug} agent={agent} delay={i * .07} />
              ))}
            </div>
          )}

          {/* Contribute CTA */}
          {!loading && agents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 rounded-2xl p-8 glass border border-[rgba(34,211,238,.1)] text-center"
            >
              <Cpu size={32} className="text-cyan-400 mx-auto mb-4 animate-pulse-slow" />
              <h3 className="font-display font-bold text-xl text-spark mb-2">
                Build your own agent
              </h3>
              <p className="text-wire text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Subclass <code className="text-cyan-400 bg-steel px-1.5 py-0.5 rounded text-xs">BaseAgent</code>, add a <code className="text-cyan-400 bg-steel px-1.5 py-0.5 rounded text-xs">config.json</code>, and open a pull-request.
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.open(CONTRIBUTING_GUIDE_URL, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink size={15} />
                Read Contributing Guide
              </Button>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}

