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
  { href: "/about", label: "About", icon: LayoutDashboard },
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
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const getUserFromStorage = () => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsedUser = JSON.parse(rawUser);
          if (parsedUser?.username || parsedUser?.full_name) {
            return parsedUser;
          }
        } catch {
          // Ignore malformed stored user value and fallback to token decoding.
        }
      }

      // Fallback: derive displayable identity from JWT payload if user object is absent.
      const token = localStorage.getItem("access_token");
      if (!token || token.split(".").length < 2) return null;

      const payloadPart = token.split(".")[1];
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((ch) => `%${(`00${ch.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      );
      const payload = JSON.parse(jsonPayload);

      if (!payload?.username) return null;
      return {
        username: payload.username,
        full_name: payload.username,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);

    const syncUserFromStorage = () => {
      setCurrentUser(getUserFromStorage());
    };

    const handleStorage = (event) => {
      if (!event.key || ["user", "access_token", "refresh_token", "user_role"].includes(event.key)) {
        syncUserFromStorage();
      }
    };

    const onFocus = () => syncUserFromStorage();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncUserFromStorage();
      }
    };

    syncUserFromStorage();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const onRouteChange = () => {
      setCurrentUser(getUserFromStorage());
      setUserMenuOpen(false);
    };

    router.events.on("routeChangeComplete", onRouteChange);
    return () => router.events.off("routeChangeComplete", onRouteChange);
  }, [router.events]);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_role");
    setCurrentUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const displayName = currentUser?.username || currentUser?.full_name || "Account";

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
            {/* Auth controls */}
            <div className="hidden md:flex items-center gap-2 relative">
              {currentUser ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-spark border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all"
                  >
                    {displayName}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 min-w-[160px] rounded-lg border border-wire/20 bg-slate-900 shadow-xl p-1 z-50">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>


            {/* Mobile menu toggle */}
            {currentUser && (
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="md:hidden px-3 py-1.5 rounded-lg text-xs font-medium text-spark border border-cyan-400/40 bg-cyan-400/10"
              >
                {displayName}
              </button>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center glass border border-[rgba(255,255,255,.06)] text-wire hover:text-spark transition-all"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {currentUser && userMenuOpen && (
          <div className="md:hidden px-6 pb-3 flex justify-end">
            <div className="min-w-[160px] rounded-lg border border-wire/20 bg-slate-900 shadow-xl p-1 z-50">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

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
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 rounded-lg text-sm font-medium text-spark border border-cyan-400/40 bg-cyan-400/10 text-center">
                        {displayName}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-300 border border-red-400/30 hover:bg-red-500/10 transition-all text-center"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
