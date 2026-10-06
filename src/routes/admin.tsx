import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import {
  CATEGORIES,
  CITIES,
  formatFollowers,
  formatPrice,
  type CreatorStatus,
} from "@/lib/directory-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Platform admin view: manage creators, statuses, featured profiles, categories, locations, subscriptions, businesses and reported profiles.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

const TABS = ["Creators", "Subscriptions", "Businesses", "Reports", "Taxonomy"] as const;
const STATUSES: CreatorStatus[] = [
  "Draft",
  "Inactive",
  "Active",
  "Expired",
  "Suspended",
];

function Admin() {
  const {
    creators,
    business,
    reports,
    subscriptions,
    setCreatorStatus,
    removeCreator,
    toggleFeatured,
  } = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Creators");

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <SectionEyebrow>Platform admin</SectionEyebrow>
      <h1 className="mt-2 text-3xl leading-tight">Manage the directory</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                : "rounded-full px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-border"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Creators" ? (
        <div className="mt-5 space-y-3">
          {creators.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <img
                    src={c.photo}
                    alt={c.name}
                    loading="lazy"
                    width={816}
                    height={816}
                    className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.name}</p>
                      <StatusPill status={c.status} />
                      {c.featured ? (
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-saffrondeep">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.locality}, {c.city} · {formatFollowers(c.followers)} ·{" "}
                      {formatPrice(c.startingPrice)} · {c.categories.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.contact.phone} · {c.contact.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.status}
                    onChange={(e) =>
                      setCreatorStatus(c.id, e.target.value as CreatorStatus)
                    }
                    className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-xs"
                    onClick={() => toggleFeatured(c.id)}
                  >
                    {c.featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Link
                    to="/creators/$creatorId"
                    params={{ creatorId: c.id }}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border"
                  >
                    View
                  </Link>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-xs text-rose"
                    onClick={() => removeCreator(c.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "Subscriptions" ? (
        <Card className="mt-5">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {subscriptions.map((s) => {
                const isQueued = s.isQueued || s.status === "queued" || new Date(s.startedAt).getTime() > Date.now();
                return (
                  <li key={s.id || s.startedAt} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {creators.find((c) => c.id === s.creatorId)?.name ?? s.creatorId}
                      </span>
                      {isQueued ? (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-tealdeep">
                          Queued (starts {new Date(s.startedAt).toLocaleDateString("en-IN")})
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-saffrondeep">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {s.duration} · {formatPrice(s.price)} ·{" "}
                      {new Date(s.startedAt).toLocaleDateString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}

      {tab === "Businesses" ? (
        <Card className="mt-5">
          {business ? (
            <div className="text-sm">
              <p className="font-semibold">{business.businessName}</p>
              <p className="text-muted-foreground">
                {business.name} · {business.mobile} · {business.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No business accounts registered yet.
            </p>
          )}
        </Card>
      ) : null}

      {tab === "Reports" ? (
        <Card className="mt-5">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reported profiles.</p>
          ) : (
            <ul className="space-y-4 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="border-b border-border pb-3 last:border-0">
                  <p className="font-semibold">
                    {creators.find((c) => c.id === r.creatorId)?.name ?? r.creatorId} ·{" "}
                    <span className="text-rose">{r.reason}</span>
                  </p>
                  {r.details ? (
                    <p className="mt-1 text-muted-foreground">{r.details}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.at).toLocaleString("en-IN")}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2 px-3 py-2 text-xs"
                    onClick={() => setCreatorStatus(r.creatorId, "Suspended")}
                  >
                    Suspend this creator
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {tab === "Taxonomy" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-lg">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg">Locations</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
