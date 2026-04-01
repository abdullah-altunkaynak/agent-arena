import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Zap,
  LayoutDashboard,
  Bot,
  Menu,
  X,
  Activity,
  BookOpen,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/arena", label: "Arena", icon: Zap },
  { href: "/agents", label: "Agents", icon: Bot },
];

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "glass border-b border-[rgba(34,211,238,.12)] shadow-[0_4px_24px_rgba(0,0,0,.4)]"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-neon-cyan">
                <Cpu size={16} className="text-void" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-acid-400 rounded-full border border-void animate-pulse-slow" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-spark group-hover:neon-text-cyan transition-all">
              Agent<span className="text-cyan-400">Arena</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? "text-cyan-400 bg-cyan-400/10"
                    : "text-wire hover:text-spark hover:bg-white/5"
                    }`}
                >
                  <Icon size={15} />
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg border border-cyan-400/30"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* System status indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-acid-400/10 border border-acid-400/20 text-xs font-mono text-acid-400">
              <Activity size={11} className="animate-pulse" />
              LIVE
            </div>

            {/* Theme toggle */}
            {mounted && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center glass border border-[rgba(255,255,255,.06)] text-wire hover:text-spark transition-all"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden glass border-t border-[rgba(34,211,238,.1)]"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${router.pathname === href
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-wire hover:text-spark hover:bg-white/5"
                      }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
