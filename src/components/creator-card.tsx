import { Link } from "@tanstack/react-router";
import { calculateAge, formatFollowers, formatPrice, type Creator } from "@/lib/directory-data";

export function CreatorCard({ creator, index = 0 }: { creator: Creator; index?: number }) {
  const age = calculateAge(creator.birthDate);

  return (
    <article
      className="glass-card animate-fade-up flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* ── 3:4 PORTRAIT PHOTO ── */}
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-secondary">
        <img
          src={creator.photo}
          alt={creator.name}
          loading="lazy"
          width={816}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />

        {/* Gradient scrim — stronger at bottom for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Collab type — top-left */}
        <span className="absolute top-3 left-3 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
          {creator.collabType}
        </span>

        {/* Followers — top-right */}
        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {formatFollowers(creator.followers)} followers
        </span>

        {/* Name + location + age — pinned to bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <h3 className="truncate font-display text-base font-semibold leading-tight text-white">
            {creator.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-white/80">
            {[creator.locality, creator.city].filter(Boolean).join(", ")}
            {age !== null ? ` · ${age} yrs` : ""}
          </p>
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Category + content type pills */}
        <div className="flex flex-wrap gap-1.5">
          {creator.categories.map((cat) => (
            <span
              key={cat}
              className="rounded-md bg-saffrondeep/10 px-2 py-0.5 text-[11px] font-semibold text-saffrondeep"
            >
              {cat}
            </span>
          ))}
          {creator.contentTypes.slice(0, 2).map((ct) => (
            <span
              key={ct}
              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {ct}
            </span>
          ))}
          {creator.contentTypes.length > 2 && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{creator.contentTypes.length - 2}
            </span>
          )}
        </div>

        {/* Bio — clamped to 2 lines */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {creator.about}
        </p>

        {/* ── FOOTER: price + CTA ── */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              From
            </p>
            <p className="font-display text-xl font-semibold leading-none">
              {formatPrice(creator.startingPrice)}
            </p>
          </div>
          <Link
            to="/creators/$creatorId"
            params={{ creatorId: creator.id }}
            className="rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            View profile →
          </Link>
        </div>
      </div>
    </article>
  );
}
