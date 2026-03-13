import { motion } from "framer-motion";
import { clsx } from "clsx";

export default function Card({
  children,
  className = "",
  glow = false,
  hover = true,
  delay = 0,
  rotating = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: .2 } } : undefined}
      className={clsx(
        "relative rounded-xl overflow-hidden",
        "bg-forge border border-[rgba(255,255,255,.05)]",
        "shadow-card transition-all duration-300",
        hover && "hover:shadow-card-hover hover:border-[rgba(34,211,238,.15)]",
        glow && "shadow-neon-cyan",
        rotating && "rotating-border",

        className
      )}
    >
      {/* Subtle inner highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      {children}
    </motion.div>
  );
}
