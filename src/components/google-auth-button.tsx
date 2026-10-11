import { useState } from "react";
import { supabaseDb } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  role?: "business" | "creator";
  redirectTarget?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function GoogleAuthButton({
  role = "business",
  redirectTarget,
  label = "Continue with Google",
  className = "",
  disabled = false,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supabaseDb.signInWithGoogle(role, redirectTarget);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleClick}
        className={`w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-secondary/70 hover:border-foreground/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <GoogleIcon className="size-4 shrink-0" />
        )}
        <span>{loading ? "Connecting to Google..." : label}</span>
      </button>
      {error ? (
        <p className="mt-2 text-xs text-rose text-center">{error}</p>
      ) : null}
    </div>
  );
}
