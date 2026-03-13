import { motion } from "framer-motion";
import { clsx } from "clsx";

/**
 * StatusBadge — colored inline badge.
 * status: "online" | "offline" | "limited" | "warning" | "neutral" | "running"
 */
export default function StatusBadge({ status, label, pulse = false }) {
  const map = {
    online:  { dot: "bg-acid-400",  text: "text-acid-400",  bg: "bg-acid-400/10",   border: "border-acid-400/25" },
    offline: { dot: "bg-rose-500",  text: "text-rose-400",  bg: "bg-rose-500/10",   border: "border-rose-500/25" },
    limited: { dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10",  border: "border-amber-400/25" },
    warning: { dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10",  border: "border-amber-400/25" },
    neutral: { dot: "bg-mist",      text: "text-wire",      bg: "bg-white/5",        border: "border-white/10" },
    running: { dot: "bg-cyan-400",  text: "text-cyan-400",  bg: "bg-cyan-400/10",   border: "border-cyan-400/25" },
  };
  const s = map[status] || map.neutral;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border",
        s.text, s.bg, s.border
      )}
    >
      <motion.span
        className={clsx("w-1.5 h-1.5 rounded-full", s.dot)}
        animate={pulse ? { scale: [1, 1.5, 1], opacity: [1, .6, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      {label ?? status}
    </span>
  );
}
