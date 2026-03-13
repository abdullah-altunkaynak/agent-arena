import { motion } from "framer-motion";

/**
 * StatWidget — compact KPI tile used on arena dashboard.
 */
export default function StatWidget({ label, value, sub, icon: Icon, color = "cyan", delay = 0 }) {
  const colorMap = {
    cyan:  { text: "text-cyan-400",  bg: "bg-cyan-400/10",  border: "border-cyan-400/20"  },
    acid:  { text: "text-acid-400",  bg: "bg-acid-400/10",  border: "border-acid-400/20"  },
    amber: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    rose:  { text: "text-rose-400",  bg: "bg-rose-400/10",  border: "border-rose-400/20"  },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, scale: .94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-xl p-5 bg-forge border border-[rgba(255,255,255,.05)] shadow-card
                 hover:border-[rgba(34,211,238,.15)] hover:shadow-card-hover transition-all duration-300 group"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} border ${c.border}`}>
          {Icon && <Icon size={18} className={c.text} />}
        </div>
      </div>
      <div className={`text-3xl font-display font-bold ${c.text} mb-0.5`}>{value}</div>
      <div className="text-xs font-mono text-wire uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-mist mt-1">{sub}</div>}
    </motion.div>
  );
}
