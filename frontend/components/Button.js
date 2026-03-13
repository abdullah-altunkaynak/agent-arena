import { motion } from "framer-motion";
import { clsx } from "clsx";

const VARIANTS = {
  primary: "bg-gradient-to-r from-cyan-500 to-cyan-400 text-void hover:from-cyan-400 hover:to-cyan-300 shadow-neon-cyan",
  secondary: "bg-forge border border-[rgba(34,211,238,.2)] text-cyan-400 hover:bg-steel hover:border-cyan-400/40",
  ghost: "bg-transparent border border-[rgba(255,255,255,.08)] text-wire hover:text-spark hover:border-[rgba(255,255,255,.2)]",
  danger: "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-500 hover:to-rose-400",
  acid: "bg-gradient-to-r from-acid-600 to-acid-400 text-void hover:from-acid-500 hover:to-acid-300 shadow-neon-acid",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  type = "button",
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: .96 }}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 rounded-lg font-semibold font-display",
        "transition-all duration-200 overflow-hidden",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        sizeClasses[size],
        VARIANTS[variant],
        (disabled || loading) && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {/* Shimmer effect on hover */}
      <span
        className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent
                   group-hover:translate-x-[100%] transition-transform duration-500"
        aria-hidden
      />
      {children}
    </motion.button>
  );
}
