import { motion } from "framer-motion";

/**
 * Terminal — renders a stylised terminal/log window.
 */
export default function Terminal({ lines = [], title = "SYSTEM LOG", className = "" }) {
  return (
    <div className={`rounded-xl overflow-hidden border border-[rgba(34,211,238,.12)] bg-abyss ${className}`}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(34,211,238,.1)] bg-void/60">
        <span className="w-3 h-3 rounded-full bg-rose-500/70" />
        <span className="w-3 h-3 rounded-full bg-amber-400/70" />
        <span className="w-3 h-3 rounded-full bg-acid-400/70" />
        <span className="ml-3 text-xs font-mono text-mist tracking-widest uppercase">{title}</span>
      </div>
      {/* Lines */}
      <div className="p-4 space-y-1.5 max-h-64 overflow-y-auto font-mono text-xs">
        {lines.length === 0 ? (
          <span className="text-mist cursor-blink">awaiting input</span>
        ) : (
          lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className={`leading-relaxed ${
                line.type === "error"   ? "text-rose-400"    :
                line.type === "success" ? "text-acid-400"    :
                line.type === "warn"    ? "text-amber-400"   :
                line.type === "accent"  ? "text-cyan-400"    :
                "text-wire"
              }`}
            >
              <span className="text-mist select-none mr-2">{String(i + 1).padStart(2, "0")}</span>
              {line.type === "accent" && <span className="text-cyan-500 mr-1">›</span>}
              {line.text}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
