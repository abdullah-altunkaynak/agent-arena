import { motion } from "framer-motion";

/**
 * ScoreBar — animated horizontal bar for rendering agent scores (0–1).
 */
export default function ScoreBar({ label, value, color = "cyan", delay = 0 }) {
  const pct = Math.round(value * 100);

  const colorMap = {
    cyan:  { bar: "bg-gradient-to-r from-cyan-600 to-cyan-400",  text: "text-cyan-400"  },
    acid:  { bar: "bg-gradient-to-r from-acid-600 to-acid-400",  text: "text-acid-400"  },
    amber: { bar: "bg-gradient-to-r from-amber-600 to-amber-400",text: "text-amber-400" },
    rose:  { bar: "bg-gradient-to-r from-rose-700 to-rose-500",  text: "text-rose-400"  },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-wire uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-mono font-bold ${c.text}`}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-steel overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
