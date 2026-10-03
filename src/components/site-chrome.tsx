import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAppState } from "@/lib/app-state";
import {
  Building2,
  Sparkles,
  User,
  LogOut,
  Compass,
  Menu,
  X,
  Gift,
  Mail,
} from "lucide-react";

export function SiteHeader() {
  const { business, signOutBusiness, myCreatorId, creators, signOutCreator } =
    useAppState();
  const myCreator = creators.find((c) => c.id === myCreatorId);
  const isLoggedIn = !!(business || myCreator);

  const [menuOpen, setMenuOpen] = useState(false);
  const routerState = useRouterState();
  const isLandingPage = routerState.location.pathname === "/";

  // Close menu on route change / ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    closeMenu();
    if (isLandingPage || window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2" onClick={handleLogoClick}>
            <img
              src="/logo.png"
              alt="Influencer Dhundo logo"
              className="size-8 rounded-full"
            />
            <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">
              Influencer <span className="text-saffrondeep">Dhundo</span>
            </span>
          </Link>

          {/* RIGHT ACTIONS — desktop */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors"
            >
              <Compass className="size-3.5" />
              <span>Find creators</span>
            </Link>

            <a
              href="/#pricing"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors"
            >
              <Gift className="size-3.5 text-saffrondeep" />
              <span>Pricing &amp; Trial</span>
            </a>

            {/* Logged in as Business */}
            {business ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Building2 className="size-3" />
                  <span className="max-w-[120px] truncate sm:max-w-[160px]">
                    {business.businessName}
                  </span>
                </span>
                <button
                  onClick={signOutBusiness}
                  title="Sign out of business account"
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border hover:bg-secondary transition-colors"
                >
                  <LogOut className="size-3" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : null}

            {/* Logged in as Creator */}
            {!business && myCreator ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/creator/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-saffrondeep/10 px-3 py-1 text-xs font-semibold text-saffrondeep hover:bg-saffrondeep/20 transition-colors"
                >
                  <User className="size-3.5" />
                  <span className="max-w-[120px] truncate sm:max-w-[160px]">
                    {myCreator.name.split(" ")[0]}
                  </span>
                </Link>
                <button
                  onClick={signOutCreator}
                  title="Sign out of creator profile"
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border hover:bg-secondary transition-colors"
                >
                  <LogOut className="size-3" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : null}

            {/* Not logged in */}
            {!business && !myCreator ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/business/login"
                  className="inline-flex items-center gap-1 rounded-xl bg-background px-2.5 sm:px-3 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
                >
                  <Building2 className="size-3 text-primary shrink-0" />
                  <span>Business Login</span>
                </Link>
                <Link
                  to="/creator/login"
                  className="inline-flex items-center gap-1 rounded-xl bg-foreground px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
                >
                  <Sparkles className="size-3 text-saffron shrink-0" />
                  <span>Creator Login</span>
                </Link>
              </div>
            ) : null}
          </div>

          {/* MOBILE: hamburger / close icon */}
          <button
            className="sm:hidden inline-flex items-center justify-center size-9 rounded-xl ring-1 ring-border bg-background hover:bg-secondary transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out sm:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2"
          >
            <img
              src="/logo.png"
              alt="Influencer Dhundo logo"
              className="size-7 rounded-full"
            />
            <span className="font-display text-base font-semibold tracking-tight">
              Influencer <span className="text-saffrondeep">Dhundo</span>
            </span>
          </Link>
          <button
            onClick={closeMenu}
            className="size-8 inline-flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close menu"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Drawer body */}
        <nav className="flex flex-col gap-3 p-5 flex-1 overflow-y-auto">
          {/* Find creators link */}
          <Link
            to="/discover"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Compass className="size-4 shrink-0" />
            Find Creators
          </Link>

          <a
            href="/#pricing"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Gift className="size-4 text-saffrondeep shrink-0" />
            Pricing &amp; Free Trial
          </a>

          <div className="h-px bg-border my-1" />

          {/* ── Logged in as Business ── */}
          {business ? (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
                <Building2 className="size-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-primary truncate">
                  {business.businessName}
                </span>
              </div>
              <button
                onClick={() => {
                  signOutBusiness();
                  closeMenu();
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
                Sign Out
              </button>
            </>
          ) : null}

          {/* ── Logged in as Creator ── */}
          {!business && myCreator ? (
            <>
              <Link
                to="/creator/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl bg-saffrondeep/10 px-4 py-3"
              >
                <User className="size-4 text-saffrondeep shrink-0" />
                <span className="text-sm font-semibold text-saffrondeep truncate">
                  {myCreator.name.split(" ")[0]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">Dashboard →</span>
              </Link>
              <button
                onClick={() => {
                  signOutCreator();
                  closeMenu();
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
                Sign Out
              </button>
            </>
          ) : null}

          {/* ── Not logged in ── */}
          {!business && !myCreator ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground px-1">
                Sign in / Sign up
              </p>

              <Link
                to="/business/login"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl bg-background ring-1 ring-border px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <Building2 className="size-4 text-primary shrink-0" />
                Business Login
              </Link>

              <Link
                to="/business/signup"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl bg-background ring-1 ring-border px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                <Building2 className="size-4 text-primary shrink-0" />
                Business Sign Up
              </Link>

              <div className="h-px bg-border my-1" />

              <Link
                to="/creator/login"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                <Sparkles className="size-4 text-saffron shrink-0" />
                Creator Login
              </Link>

              <Link
                to="/creator/register"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                <Sparkles className="size-4 text-saffron shrink-0" />
                Creator Sign Up
              </Link>
            </div>
          ) : null}
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-border text-xs text-muted-foreground">
          Influencer Dhundo — a directory, not an agency.
        </div>
      </aside>
    </>
  );
}

export function SiteFooter() {
  const routerState = useRouterState();
  const isLandingPage = routerState.location.pathname === "/";

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isLandingPage || window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
      }
    }
  };

  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Brand & Description */}
          <div className="space-y-4 sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5" onClick={handleLogoClick}>
              <img
                src="/logo.png"
                alt="Influencer Dhundo logo"
                className="size-8 rounded-full ring-1 ring-border/50"
              />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                Influencer <span className="text-saffrondeep">Dhundo</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              Discover and connect with local creators in your city. Direct contact, 0% commission, and transparent pricing.
            </p>
            <div className="pt-1">
              <a
                href="mailto:support@influencerdhundo.com"
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="size-3.5 text-primary" />
                <span>support@influencerdhundo.com</span>
              </a>
            </div>
          </div>

          {/* Creators */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              For Creators
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/creator/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Join as Creator
                </Link>
              </li>
              <li>
                <Link to="/creator/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Creator Login
                </Link>
              </li>
              <li>
                <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing &amp; 3-Day Trial
                </a>
              </li>
              <li>
                <Link to="/creator/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Creator Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Businesses */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              For Businesses
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Find Creators
                </Link>
              </li>
              <li>
                <Link to="/business/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Business Sign Up
                </Link>
              </li>
              <li>
                <Link to="/business/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Business Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal &amp; Policy
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Refund &amp; Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Influencer Dhundo. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Influencer Dhundo is a discovery directory, not an agency.
          </p>
        </div>
      </div>
    </footer>
  );
}
