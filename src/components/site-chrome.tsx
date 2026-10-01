import { Link } from "@tanstack/react-router";
import { useAppState } from "@/lib/app-state";
import { Building2, Sparkles, User, LogOut, Compass } from "lucide-react";

export function SiteHeader() {
  const { business, signOutBusiness, myCreatorId, creators, signOutCreator } = useAppState();
  const myCreator = creators.find((c) => c.id === myCreatorId);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="influencer Dhundo logo" className="size-8 rounded-full" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Influencer <span className="text-saffrondeep">Dhundo</span>
          </span>
        </Link>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/discover"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors"
          >
            <Compass className="size-3.5" />
            <span>Find creators</span>
          </Link>

          {/* LOGGED IN AS BUSINESS */}
          {business ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Building2 className="size-3" />
                <span className="max-w-[120px] truncate sm:max-w-[160px]">{business.businessName}</span>
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

          {/* LOGGED IN AS CREATOR */}
          {!business && myCreator ? (
            <div className="flex items-center gap-2">
              <Link
                to="/creator/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-saffrondeep/10 px-3 py-1 text-xs font-semibold text-saffrondeep hover:bg-saffrondeep/20 transition-colors"
              >
                <Sparkles className="size-3" />
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

          {/* NOT LOGGED IN: SHOW BOTH BUSINESS AND CREATOR LOGIN */}
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
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
        <p>Influencer Dhundo — a directory, not an agency.</p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/discover" className="hover:text-foreground">
            Find creators
          </Link>
          <Link to="/business/login" className="hover:text-foreground">
            For businesses
          </Link>
          <Link to="/creator/login" className="hover:text-foreground">
            For creators
          </Link>
          <Link to="/admin" className="hover:text-foreground">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
