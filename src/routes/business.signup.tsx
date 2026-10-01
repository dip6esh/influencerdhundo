import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/business/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create a free business account — influencer Dhundo" },
      {
        name: "description",
        content:
          "Create a free business account to view creator contact details. No subscription, no lengthy profile.",
      },
      { property: "og:title", content: "Free business account — influencer Dhundo" },
      {
        property: "og:description",
        content: "Sign up free to access creator contact numbers.",
      },
    ],
  }),
  component: BusinessSignup,
});

function BusinessSignup() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const targetUrl = redirect || "/discover";
  const { signUpBusiness } = useAppState();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    mobile: "",
    email: "",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.name.trim() || !form.businessName.trim()) {
      setError("Please enter your name and business name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ""))) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    signUpBusiness(form);
    router.history.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 flex flex-col items-center text-center">
          <div className="max-w-xl w-full">
            <SectionEyebrow>Free business account</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Want to contact creators?
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Create a free account to view direct contact details. Browsing stays free and always will.
            </p>
          </div>

          <div className="mt-8 max-w-xl w-full">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              <div className="space-y-4">
                <Field label="Your name">
                  <TextInput
                    value={form.name}
                    maxLength={100}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rahul Verma"
                  />
                </Field>
                <Field label="Business name">
                  <TextInput
                    value={form.businessName}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Cafe Mocha, Thane West"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile number">
                    <TextInput
                      value={form.mobile}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="9820011223"
                    />
                  </Field>
                  <Field label="Email">
                    <TextInput
                      value={form.email}
                      type="email"
                      maxLength={255}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@business.com"
                    />
                  </Field>
                </div>
                {error ? <p className="text-sm font-medium text-rose">{error}</p> : null}
                <Button variant="primary" className="w-full py-3.5 text-base font-semibold" onClick={submit}>
                  Create free account
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  That's it — no business subscription, no long profile.
                </p>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Already have a business account?{" "}
                <a
                  href={`/business/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                  className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Log in
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
