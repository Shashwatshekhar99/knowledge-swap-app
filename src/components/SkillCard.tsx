import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Video } from "lucide-react";

import { RatingStars } from "@/components/RatingStars";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OfferingWithProvider, ProviderStats } from "@/lib/skillswap";

export function SkillCard({
  offering,
  stats,
  isOwn,
  onRequest,
}: {
  offering: OfferingWithProvider;
  stats?: ProviderStats;
  isOwn?: boolean;
  onRequest?: (offering: OfferingWithProvider) => void;
}) {
  const provider = offering.provider;
  const FormatIcon = offering.format === "In Person" ? MapPin : Video;

  return (
    <article className="card-surface group flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-3">
        <UserAvatar name={provider?.full_name} url={provider?.avatar_url} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{provider?.full_name ?? "SkillSwap student"}</p>
          <p className="truncate text-xs text-muted-foreground">{provider?.college ?? "Student"}</p>
        </div>
      </div>

      <Link
        to="/skills/$id"
        params={{ id: offering.id }}
        className="mt-4 block rounded-md text-lg font-bold leading-snug tracking-tight transition-colors hover:text-accent"
      >
        {offering.title}
      </Link>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{offering.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full font-medium">
          {offering.category}
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" /> {offering.session_duration} min
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <FormatIcon className="size-3.5" aria-hidden="true" /> {offering.format}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex flex-col gap-0.5">
          <RatingStars value={stats?.rating ?? 0} count={stats?.reviewCount} />
          <span className="text-xs text-muted-foreground">
            {stats?.sessions ?? 0} session{(stats?.sessions ?? 0) === 1 ? "" : "s"} completed
          </span>
        </div>
        {isOwn ? (
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link to="/edit-skill/$id" params={{ id: offering.id }}>
              Edit
            </Link>
          </Button>
        ) : onRequest ? (
          <Button size="sm" className="rounded-xl" onClick={() => onRequest(offering)}>
            Request Session
          </Button>
        ) : (
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/skills/$id" params={{ id: offering.id }}>
              View
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
