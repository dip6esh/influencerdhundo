import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, supabaseDb } from "@/lib/supabase";
import { useAppState, type BusinessAccount } from "@/lib/app-state";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui-kit";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { role?: string | undefined; redirect?: string | undefined } => ({
    role: typeof search["role"] === "string" ? search["role"] : undefined,
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Signing in with Google — Influencer Dhundo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { role, redirect } = Route.useSearch();
  const { signUpBusiness, loginCreator, upsertCreator } = useAppState();
  const [statusMessage, setStatusMessage] = useState("Verifying your Google account...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function handleAuth() {
      try {
        // Check if there is an auth code in the query params (PKCE OAuth flow)
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          if (code) {
            const { data: exchanged, error: exchangeErr } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr && exchanged?.session && active) {
              await processSession(exchanged.session);
              return;
            }
          }
        }

        // Give Supabase auth client a brief moment to parse hash / existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (active) setErrorMessage(sessionError.message);
          return;
        }

        let currentSession = session;

        // If not immediately available, listen for first auth event
        if (!currentSession) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession && active) {
              authListener.subscription.unsubscribe();
              await processSession(newSession);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (active && !currentSession) {
              authListener.subscription.unsubscribe();
              setErrorMessage("Authentication session timed out. Please try logging in again.");
            }
          }, 6000);
          return;
        }

        await processSession(currentSession);
      } catch (e) {
        if (active) setErrorMessage(String(e));
      }
    }

    async function processSession(sess: any) {
      if (!sess?.user) {
        if (active) setErrorMessage("No user profile returned from Google. Please try again.");
        return;
      }

      const user = sess.user;
      setStatusMessage("Loading your profile...");

      const storedRole =
        typeof window !== "undefined" ? sessionStorage.getItem("influencer_oauth_role") : null;
      const storedRedirect =
        typeof window !== "undefined" ? sessionStorage.getItem("influencer_oauth_redirect") : null;
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("influencer_oauth_role");
        sessionStorage.removeItem("influencer_oauth_redirect");
      }

      // Look up existing creator or business profile
      const [creatorProfile, businessProfile] = await Promise.all([
        supabaseDb.getCreatorProfileForAuthUser(user.id, user.email),
        supabaseDb.getBusinessProfileForAuthUser(user.id, user.email),
      ]);

      // Explicit role requested from the login screen they clicked
      const explicitRole = role || storedRole;

      let isCreatorIntent: boolean;
      if (explicitRole === "creator") {
        isCreatorIntent = true;
      } else if (explicitRole === "business") {
        isCreatorIntent = false;
      } else {
        // Fallback when general /login is used without a role
        isCreatorIntent = !!(creatorProfile && !businessProfile);
      }

      if (isCreatorIntent) {
        if (creatorProfile) {
          upsertCreator(creatorProfile, true);
          loginCreator(creatorProfile.id);
          navigate({ to: "/creator/dashboard", replace: true });
        } else {
          // New creator: prefill registration wizard with Google info
          navigate({
            to: "/creator/register",
            search: {
              email: user.email,
              name: user.user_metadata?.full_name,
            },
            replace: true,
          });
        }
      } else {
        // Business path (default)
        if (businessProfile && businessProfile.mobile) {
          signUpBusiness(businessProfile, user.id);
          const destination = redirect || storedRedirect || "/discover";
          navigate({ to: destination as any, replace: true });
        } else {
          // If business account does not exist or mobile number is missing,
          // guide them to the quick 10-second completion screen
          navigate({
            to: "/business/complete-profile",
            search: {
              redirect: redirect || storedRedirect || undefined,
            },
            replace: true,
          });
        }
      }
    }

    handleAuth();

    return () => {
      active = false;
    };
  }, [role, redirect, navigate, signUpBusiness, loginCreator, upsertCreator]);

  return (
    <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-5">
      <Card className="glass-card max-w-md w-full p-8 rounded-3xl shadow-2xl border border-border/80 text-center space-y-4">
        {errorMessage ? (
          <div>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose/10 text-rose mb-3">
              ✕
            </div>
            <h2 className="text-xl font-display font-semibold">Sign-in failed</h2>
            <p className="mt-2 text-xs text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => navigate({ to: "/login", replace: true })}
              className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all"
            >
              Back to Log in
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <h2 className="text-lg font-display font-semibold">{statusMessage}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Connecting you securely to Influencer Dhundo...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
