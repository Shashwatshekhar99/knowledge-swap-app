import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import type { RequestWithDetails } from "@/lib/skillswap";

export function RequestCard({
  request,
  mode,
  pending,
  hasReviewed,
  onUpdateStatus,
  onReview,
}: {
  request: RequestWithDetails;
  mode: "incoming" | "sent";
  pending?: boolean;
  hasReviewed?: boolean;
  onUpdateStatus: (status: string) => void;
  onReview: () => void;
}) {
  const person = mode === "incoming" ? request.requester : request.provider;

  return (
    <article className="card-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={person?.full_name} url={person?.avatar_url} />
          <div>
            <p className="text-sm font-semibold">{person?.full_name ?? "SkillSwap student"}</p>
            <p className="text-xs text-muted-foreground">{person?.college ?? "Student"}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-4 text-sm font-semibold">
        {request.offering ? (
          <Link
            to="/skills/$id"
            params={{ id: request.offering.id }}
            className="transition-colors hover:text-accent"
          >
            {request.offering.title}
          </Link>
        ) : (
          "Skill offering removed"
        )}
      </p>

      {request.message ? (
        <p className="mt-2 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
          “{request.message}”
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {request.preferred_date ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {new Date(request.preferred_date).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : null}
        {request.preferred_time ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {request.preferred_time}
          </span>
        ) : null}
        <span>Sent {new Date(request.created_at).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        {mode === "incoming" && request.status === "pending" ? (
          <>
            <Button
              size="sm"
              className="rounded-xl"
              disabled={pending}
              onClick={() => onUpdateStatus("accepted")}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              disabled={pending}
              onClick={() => onUpdateStatus("declined")}
            >
              Decline
            </Button>
          </>
        ) : null}

        {mode === "sent" && request.status === "pending" ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={() => onUpdateStatus("cancelled")}
          >
            Cancel Request
          </Button>
        ) : null}

        {request.status === "accepted" ? (
          <Button
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => onUpdateStatus("completed")}
          >
            Mark as Completed
          </Button>
        ) : null}

        {request.status === "completed" ? (
          hasReviewed ? (
            <span className="text-xs font-medium text-muted-foreground">Review submitted ✓</span>
          ) : (
            <Button size="sm" variant="outline" className="rounded-xl" onClick={onReview}>
              Leave a Review
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
}
