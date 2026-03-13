import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Play, RotateCcw, ChevronDown, Lock, Cpu, Activity,
  Clock, DollarSign, Target, Trophy, AlertTriangle, CheckCircle,
  Loader, Settings, Eye, EyeOff,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Card from "../components/Card";
import ScoreBar from "../components/ScoreBar";
import StatWidget from "../components/StatWidget";
import StatusBadge from "../components/StatusBadge";
import Terminal from "../components/Terminal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── helpers ─────────────────────────────────────────────────────────────────
function buildLog(result) {
  if (!result) return [];
  const lines = [
    { type: "accent", text: `Scenario: ${result.scenario_id}` },
    { type: "text",   text: `Turns executed: ${result.turns.length}` },
    { type: "text",   text: "──────────────────────────────────────" },
  ];
  result.turns.forEach((t) => {
    lines.push({ type: "accent", text: `Turn ${t.turn} · ${t.agent} [${t.duration_ms}ms]` });
    lines.push({ type: "text",   text: `  Action: ${t.action}` });
    if (t.reasoning) lines.push({ type: "text", text: `  Reason: ${t.reasoning}` });
  });
  lines.push({ type: "text", text: "──────────────────────────────────────" });
  Object.entries(result.scores || {}).forEach(([agent, sc]) => {
    lines.push({
      type: "success",
      text: `${agent} — total: ${sc.total} | cost: ${sc.cost} | speed: ${sc.speed} | acc: ${sc.accuracy}`,
    });
  });
  return lines;
}

function ScoreCard({ agentName, scores, rank, delay = 0 }) {
  const total = scores?.total ?? 0;
  const rankColors = ["text-amber-400", "text-wire", "text-amber-600"];
  return (
    <Card delay={delay} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-mist uppercase tracking-wider mb-1">Agent</p>
          <h3 className="font-display font-semibold text-spark text-lg">{agentName}</h3>
        </div>
        <div className="text-right">
          <span className={`text-xs font-mono font-bold ${rankColors[rank] || "text-wire"}`}>
            #{rank + 1}
          </span>
          <div className={`text-3xl font-display font-bold mt-0.5 ${total >= .8 ? "text-acid-400" : total >= .5 ? "text-cyan-400" : "text-rose-400"}`}>
            {Math.round(total * 100)}
            <span className="text-base">%</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <ScoreBar label="Cost Efficiency" value={scores?.cost ?? 0} color="acid" delay={delay + .2} />
        <ScoreBar label="Speed" value={scores?.speed ?? 0} color="cyan" delay={delay + .3} />
        <ScoreBar label="Accuracy" value={scores?.accuracy ?? 0} color="amber" delay={delay + .4} />
      </div>
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,.05)] flex items-center justify-between">
        <span className="text-xs font-mono text-mist">avg decision</span>
        <span className="text-xs font-mono text-cyan-400">{scores?.avg_decision_ms ?? "—"}ms</span>
      </div>
    </Card>
  );
}

export default function Arena() {
  const [scenarios, setScenarios] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("config"); // "config" | "running" | "results"
  const [runProgress, setRunProgress] = useState(0);
  const logRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/arena/scenarios`).then((r) => r.json()),
      fetch(`${API_URL}/api/agents/`).then((r) => r.json()),
    ])
      .then(([sc, ag]) => {
        setScenarios(sc);
        setAgents(ag);
        if (sc.length) setSelectedScenario(sc[0].id);
      })
      .catch(() => {});
  }, []);

  const toggleAgent = (slug) => {
    setSelectedAgents((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleRun = async () => {
    if (!selectedScenario || selectedAgents.length === 0) return;
    setError(null);
    setResult(null);
    setPhase("running");
    setLoading(true);
    setRunProgress(0);

    // Fake progress bar while waiting for API
    const ticker = setInterval(() => {
      setRunProgress((p) => Math.min(p + Math.random() * 14, 88));
    }, 300);

    try {
      const res = await fetch(`${API_URL}/api/arena/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: selectedScenario,
          agent_names: selectedAgents,
          api_key: apiKey,
        }),
      });
      clearInterval(ticker);
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRunProgress(100);
      setTimeout(() => {
        setResult(data);
        setPhase("results");
        setLoading(false);
      }, 400);
    } catch (e) {
      clearInterval(ticker);
      setError(e.message);
      setPhase("config");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPhase("config");
    setRunProgress(0);
  };

  const scenario = scenarios.find((s) => s.id === selectedScenario);
  const sortedScores = result
    ? Object.entries(result.scores || {}).sort((a, b) => b[1].total - a[1].total)
    : [];

  const logLines = buildLog(result);

  return (
    <>
      <Head>
        <title>Arena · Agent-Arena</title>
      </Head>

      <div className="scan-overlay" aria-hidden />

      <div className="min-h-screen bg-void">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pb-20">
          {/* ── Page header ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 flex items-center justify-between border-b border-[rgba(255,255,255,.04)] mb-8"
          >
            <div>
              <h1 className="font-display font-bold text-4xl text-spark flex items-center gap-3">
                <Zap size={32} className="text-cyan-400" />
                Arena
              </h1>
              <p className="text-wire mt-1 text-sm">
                Configure your simulation and watch agents compete in real-time.
              </p>
            </div>
            {phase === "results" && (
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw size={15} />
                New Run
              </Button>
            )}
          </motion.div>

          {/* ── RUNNING STATE ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {phase === "running" && (
              <motion.div
                initial={{ opacity: 0, scale: .97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: .97 }}
                className="mb-8"
              >
                <Card className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
                      <Cpu size={28} className="absolute inset-0 m-auto text-cyan-400 animate-pulse-slow" />
                    </div>
                  </div>
                  <h2 className="font-display font-bold text-2xl text-spark mb-2">
                    Simulation running…
                  </h2>
                  <p className="text-wire text-sm mb-6">Synapse engine is orchestrating agent turns</p>
                  {/* Progress bar */}
                  <div className="max-w-sm mx-auto">
                    <div className="h-1.5 rounded-full bg-steel overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                        style={{ width: `${runProgress}%` }}
                        transition={{ duration: .3 }}
                      />
                    </div>
                    <p className="text-xs font-mono text-mist mt-2">{Math.round(runProgress)}%</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ERROR ─────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 flex items-start gap-3 px-5 py-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm font-mono">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CONFIG PANEL ──────────────────────────────────────────────── */}
          {phase === "config" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Scenario + Agents */}
              <div className="lg:col-span-2 space-y-6">
                {/* Scenario selector */}
                <Card className="p-6">
                  <h2 className="font-display font-semibold text-spark text-base mb-4 flex items-center gap-2">
                    <Target size={16} className="text-cyan-400" />
                    Select Scenario
                  </h2>
                  {scenarios.length === 0 ? (
                    <p className="text-mist text-sm font-mono">Loading scenarios…</p>
                  ) : (
                    <div className="space-y-3">
                      {scenarios.map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => setSelectedScenario(sc.id)}
                          className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                            selectedScenario === sc.id
                              ? "border-cyan-400/40 bg-cyan-400/8 shadow-neon-cyan"
                              : "border-[rgba(255,255,255,.06)] bg-forge/50 hover:border-[rgba(34,211,238,.15)] hover:bg-forge"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-semibold text-spark text-sm">
                              {sc.name}
                            </span>
                            {selectedScenario === sc.id && (
                              <CheckCircle size={15} className="text-cyan-400" />
                            )}
                          </div>
                          <p className="text-xs text-wire leading-relaxed">{sc.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-mono text-mist">{sc.max_turns} turns</span>
                            <span className="text-mist">·</span>
                            <span className="text-xs font-mono text-mist">{sc.id}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Agent selector */}
                <Card className="p-6">
                  <h2 className="font-display font-semibold text-spark text-base mb-4 flex items-center gap-2">
                    <Cpu size={16} className="text-cyan-400" />
                    Select Agents
                    {selectedAgents.length > 0 && (
                      <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
                        {selectedAgents.length} selected
                      </span>
                    )}
                  </h2>
                  {agents.length === 0 ? (
                    <p className="text-mist text-sm font-mono">Loading agents…</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {agents.map((agent) => {
                        const active = selectedAgents.includes(agent.slug);
                        return (
                          <button
                            key={agent.slug}
                            onClick={() => toggleAgent(agent.slug)}
                            className={`text-left px-4 py-4 rounded-xl border transition-all duration-200 ${
                              active
                                ? "border-cyan-400/40 bg-cyan-400/8"
                                : "border-[rgba(255,255,255,.06)] bg-forge/50 hover:border-[rgba(34,211,238,.15)]"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold
                                ${active ? "bg-cyan-400/20 text-cyan-400" : "bg-steel text-mist"}`}>
                                {agent.slug[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-display font-semibold text-spark">{agent.name}</p>
                                <p className="text-xs text-mist">{agent.author || "anonymous"}</p>
                              </div>
                              {active && <CheckCircle size={14} className="text-cyan-400 ml-auto" />}
                            </div>
                            <p className="text-xs text-wire leading-relaxed">{agent.description}</p>
                            {agent.tools?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {agent.tools.map((t) => (
                                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-steel font-mono text-wire">{t}</span>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right: Config sidebar */}
              <div className="space-y-5">
                {/* API Key */}
                <Card className="p-5">
                  <h3 className="font-display font-semibold text-spark text-sm mb-3 flex items-center gap-2">
                    <Lock size={14} className="text-amber-400" />
                    API Key (BYOK)
                  </h3>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-steel border border-[rgba(255,255,255,.06)] rounded-lg px-4 py-2.5 pr-10
                                 text-xs font-mono text-spark placeholder-mist
                                 focus:outline-none focus:border-cyan-400/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-wire transition-colors"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-mist mt-2 leading-relaxed">
                    Leave empty for lightweight agents. Required for API-powered agents.
                  </p>
                </Card>

                {/* Run summary */}
                {scenario && (
                  <Card className="p-5">
                    <h3 className="font-display font-semibold text-spark text-sm mb-4 flex items-center gap-2">
                      <Settings size={14} className="text-cyan-400" />
                      Run Config
                    </h3>
                    <dl className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <dt className="text-mist">Scenario</dt>
                        <dd className="text-cyan-400">{scenario.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-mist">Max turns</dt>
                        <dd className="text-spark">{scenario.max_turns}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-mist">Agents</dt>
                        <dd className={selectedAgents.length ? "text-acid-400" : "text-mist"}>
                          {selectedAgents.length || "none"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-mist">API Key</dt>
                        <dd className={apiKey ? "text-acid-400" : "text-mist"}>{apiKey ? "set" : "not set"}</dd>
                      </div>
                    </dl>
                  </Card>
                )}

                {/* Launch button */}
                <Button
                  variant={selectedAgents.length && selectedScenario ? "primary" : "ghost"}
                  size="lg"
                  disabled={!selectedAgents.length || !selectedScenario}
                  loading={loading}
                  onClick={handleRun}
                  className="w-full justify-center"
                >
                  {!loading && <Play size={18} />}
                  {loading ? "Running…" : "Launch Simulation"}
                </Button>

                {!selectedAgents.length && (
                  <p className="text-xs font-mono text-mist text-center">Select at least one agent to continue</p>
                )}
              </div>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────────────────────── */}
          {phase === "results" && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Winner banner */}
              {sortedScores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-2xl overflow-hidden p-8 glass border border-amber-400/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 via-transparent to-amber-400/5" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Trophy size={48} className="text-amber-400 shrink-0 animate-float" />
                    <div>
                      <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">Winner</p>
                      <h2 className="font-display font-bold text-3xl text-spark">
                        {sortedScores[0][0]}
                      </h2>
                      <p className="text-wire text-sm mt-1">
                        Total score: {Math.round(sortedScores[0][1].total * 100)}% · defeated {sortedScores.length - 1} opponent{sortedScores.length > 2 ? "s" : ""}
                      </p>
                    </div>
                    <div className="md:ml-auto flex gap-4">
                      <StatWidget
                        label="Turns"
                        value={result.turns.length}
                        icon={Activity}
                        color="cyan"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Score cards */}
              <div>
                <h3 className="font-display font-semibold text-spark text-lg mb-4 flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  Leaderboard
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedScores.map(([agentName, scores], i) => (
                    <ScoreCard key={agentName} agentName={agentName} scores={scores} rank={i} delay={i * .1} />
                  ))}
                </div>
              </div>

              {/* Turn timeline */}
              <div>
                <h3 className="font-display font-semibold text-spark text-lg mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" />
                  Turn Timeline
                </h3>
                <div className="space-y-3">
                  {result.turns.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * .06 }}
                      className="flex items-start gap-4 px-5 py-4 rounded-xl bg-forge border border-[rgba(255,255,255,.04)]
                                 hover:border-[rgba(34,211,238,.1)] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-steel text-xs font-mono font-bold flex items-center justify-center text-mist shrink-0">
                        {t.turn}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-display font-semibold text-spark">{t.agent}</span>
                          <StatusBadge status="running" label={t.action} />
                          <span className="ml-auto text-xs font-mono text-mist">{t.duration_ms}ms</span>
                        </div>
                        {t.reasoning && (
                          <p className="text-xs text-wire leading-relaxed">{t.reasoning}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Log terminal */}
              <div>
                <h3 className="font-display font-semibold text-spark text-lg mb-4 flex items-center gap-2">
                  <Cpu size={18} className="text-acid-400" />
                  Simulation Log
                </h3>
                <Terminal lines={logLines} title="SYNAPSE ENGINE OUTPUT" />
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}

