import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, Select, Tag, TextArea } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { REPORT_REASONS, calculateAge, formatFollowers, formatPrice } from "@/lib/directory-data";

export const Route = createFileRoute("/creators/$creatorId")({
  head: () => ({
    meta: [
      { title: "Creator profile — influencer Dhundo" },
      {
        name: "description",
        content:
          "See a local creator's location, audience, content formats, collaboration preferences and starting price.",
      },
      { property: "og:title", content: "Creator profile — influencer Dhundo" },
      {
        property: "og:description",
        content: "Explore a local creator's profile and connect with them directly.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    preview: search.preview === true || search.preview === "true",
  }),
  component: CreatorProfile,
});

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function CreatorProfile() {
  const { creatorId } = Route.useParams();
  const { preview } = Route.useSearch();
  const navigate = useNavigate();
  const { creators, business, addReport } = useAppState();
  const creator = creators.find((c) => c.id === creatorId);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reported, setReported] = useState(false);

  if (!creator) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h1 className="text-2xl">Creator not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may have been removed or is no longer visible.
        </p>
        <Link
          to="/discover"
          className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const age = calculateAge(creator.birthDate);

  return (
    <div className="min-h-screen bg-secondary/50 pb-28">
      <div className="mx-auto max-w-5xl px-5 py-8">

        {/* PREVIEW MODE BANNER */}
        {preview ? (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/10 border border-primary/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                👁
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Profile preview</p>
                <p className="text-xs text-muted-foreground">
                  This is how your profile looks to businesses in the public directory.
                </p>
              </div>
            </div>
            <Link
              to="/creator/dashboard"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all"
            >
              ← Back to dashboard
            </Link>
          </div>
        ) : (
          <Link
            to="/discover"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to results
          </Link>
        )}

        <Card className="glass-card mt-6 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={creator.photo}
              alt={creator.name}
              width={816}
              height={816}
              className="size-24 shrink-0 rounded-2xl object-cover ring-1 ring-border shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-display font-semibold tracking-tight">{creator.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                📍 {creator.locality}, {creator.state}
                {age !== null ? ` · ${age} yrs old` : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-tealdeep">
                {formatFollowers(creator.followers)} Instagram followers
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {creator.categories.map((c) => (
              <Tag key={c} tone="primary">
                {c}
              </Tag>
            ))}
            <Tag>{creator.languages.join(" · ")}</Tag>
          </div>

          <p className="mt-5 text-base text-pretty text-muted-foreground">{creator.about}</p>

          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {age !== null ? <Detail label="Age" value={`${age} years old`} /> : null}
            <Detail label="Creates" value={creator.contentTypes.join(" · ")} />
            <Detail label="Collaboration" value={creator.collabType} />
            <Detail
              label="Travel"
              value={creator.travels ? (creator.travelRange ?? "Yes") : "Does not travel"}
            />
            <Detail
              label="Accepts products"
              value={
                creator.acceptsProducts === "Depends" && creator.acceptsProductsDetails
                  ? `Depends (${creator.acceptsProductsDetails})`
                  : creator.acceptsProducts
              }
            />
            <Detail label="Typical turnaround" value={creator.turnaround} />
            <div>
              <dt className="label-caps">Starting from</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-saffrondeep">
                {formatPrice(creator.startingPrice)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={`https://instagram.com/${creator.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-medium ring-1 ring-border hover:bg-secondary transition-colors"
            >
              <span className="grid size-4 place-items-center rounded-[3px] bg-rose/15 text-[10px] text-rose">
                IG
              </span>
              {creator.instagram}
            </a>
            {creator.otherSocials.map((s) => (
              <span
                key={s.platform}
                className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-medium ring-1 ring-border"
              >
                {s.platform} · {s.handle}
              </span>
            ))}
          </div>
        </Card>

        {/* CONTACT */}
        {business ? (
          <Card className="glass-card mt-6 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold">
                  Contact {creator.name.split(" ")[0]}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reach out directly — the collaboration is between you and the creator.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Verified Business Access
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
              {creator.contact.phone ? (
                <a
                  href={`tel:${creator.contact.phone.replace(/\s/g, "")}`}
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-primary hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone Call
                  </span>
                  <span className="font-semibold text-foreground text-base group-hover:text-primary">
                    {creator.contact.phone}
                  </span>
                  <span className="text-xs text-primary font-medium">Click to call →</span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    Phone Call
                  </span>
                  <span>Not provided</span>
                </div>
              )}

              {creator.contact.whatsapp || creator.contact.phone ? (
                <a
                  href={`https://wa.me/${(creator.contact.whatsapp || creator.contact.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-emerald-500 hover:bg-emerald-500/5 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    WhatsApp Chat
                  </span>
                  <span className="font-semibold text-foreground text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {creator.contact.whatsapp || creator.contact.phone}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Open WhatsApp →
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    WhatsApp
                  </span>
                  <span>Not provided</span>
                </div>
              )}

              {creator.contact.email ? (
                <a
                  href={`mailto:${creator.contact.email}`}
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-primary hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="font-semibold text-foreground text-base truncate group-hover:text-primary">
                    {creator.contact.email}
                  </span>
                  <span className="text-xs text-primary font-medium">Send email →</span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    Email
                  </span>
                  <span>Not provided</span>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="mt-6 rounded-2xl sm:rounded-3xl bg-foreground p-6 sm:p-8 text-background shadow-xl">
            <p className="font-display text-xl font-semibold">Want to contact this creator?</p>
            <p className="mt-1 text-sm text-background/70">
              Create a free account to view their contact details.
            </p>
            <Button
              variant="primary"
              className="mt-5 py-3.5 px-8 font-semibold text-base"
              onClick={() =>
                navigate({
                  to: "/business/signup",
                  search: { redirect: `/creators/${creator.id}` },
                })
              }
            >
              Contact Creator
            </Button>
          </div>
        )}

        {/* REPORT — hidden in preview mode */}
        {!preview && (
          <div className="mt-6">
            {reported ? (
              <p className="text-sm font-medium text-tealdeep">
                Thanks — this profile has been reported for review.
              </p>
            ) : reportOpen ? (
              <Card>
                <h2 className="text-lg">Report this profile</h2>
                <div className="mt-4 space-y-4">
                  <Field label="Reason">
                    <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Details (optional)">
                    <TextArea
                      maxLength={500}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Tell us what's wrong with this profile"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      variant="ink"
                      onClick={() => {
                        addReport({ creatorId: creator.id, reason, details });
                        setReportOpen(false);
                        setReported(true);
                      }}
                    >
                      Submit report
                    </Button>
                    <Button variant="ghost" onClick={() => setReportOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs font-medium text-muted-foreground underline underline-offset-4"
              >
                Report this profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* STICKY BAR */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-5xl px-5 pb-4">
          <div className="glass-card flex items-center gap-3 rounded-2xl p-3 shadow-2xl border border-border/80">
            <div className="min-w-0 flex-1">
              <p className="label-caps">Starting from</p>
              <p className="font-display text-lg font-semibold leading-none text-saffrondeep">
                {formatPrice(creator.startingPrice)}
              </p>
            </div>
            {preview ? (
              <Link
                to="/creator/register"
                className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Edit profile
              </Link>
            ) : business ? (
              <a
                href={`tel:${creator.contact.phone.replace(/\s/g, "")}`}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Call Creator
              </a>
            ) : (
              <Link
                to="/business/signup"
                search={{ redirect: `/creators/${creator.id}` }}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contact Creator
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
