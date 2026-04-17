import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  LayoutDashboard,
  Bot,
  MessageSquare,
  Menu,
  X,
  Activity,
  BookOpen,
  Newspaper,
  Users,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/#ai-chat", label: "AI Chat", icon: MessageSquare },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/blog/tech-news", label: "Tech News", icon: Newspaper },
  { href: "/community", label: "Community", icon: Users },
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
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logoagentarena.png"
              alt="Agent Arena logo"
              width={46}
              height={46}
              className="rounded-xl shadow-neon-cyan"
              priority
            />
            <span className="font-display font-bold text-xl tracking-tight text-spark group-hover:neon-text-cyan transition-all">
              Agent<span className="text-cyan-400">Arena</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = href.includes("#")
                ? router.asPath === href
                : router.pathname === href;
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
          <div className="flex items-center gap-3">
            {/* Login/Signup buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-wire hover:text-spark border border-wire/20 hover:border-cyan-400/50 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-void hover:shadow-neon-cyan transition-all"
              >
                Sign Up
              </Link>
            </div>

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

                {/* Mobile auth buttons */}
                <div className="border-t border-wire/10 mt-2 pt-3 flex flex-col gap-2">
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-wire border border-wire/20 hover:border-cyan-400/50 transition-all text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-void transition-all text-center"
                  >
                    Sign Up
                  </Link>
                </div>
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
