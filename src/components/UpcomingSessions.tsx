import { CalendarClock, Clock, MapPin, Video } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  formatSessionDate,
  sessionDateOf,
  upcomingSessions,
  type RequestWithDetails,
} from "@/lib/skillswap";

export function UpcomingSessions({
  requests,
  currentUserId,
  onOpenChat,
  limit = 4,
}: {
  requests: RequestWithDetails[];
  currentUserId: string;
  onOpenChat: (request: RequestWithDetails) => void;
  limit?: number | undefined;
}) {
  const sessions = upcomingSessions(requests).slice(0, limit);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No upcoming sessions."
        description="Once a request is accepted with a date, it shows up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((request) => {
        const incoming = request.provider_id === currentUserId;
        const person = incoming ? request.requester : request.provider;
        const FormatIcon = request.offering?.format === "In Person" ? MapPin : Video;
        const date = sessionDateOf(request)!;
        return (
          <article key={request.id} className="card-surface flex flex-wrap items-center gap-3 p-4">
            <UserAvatar name={person?.full_name} url={person?.avatar_url} className="size-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {request.offering?.title ?? "Skill removed"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {incoming ? "You're teaching" : "With"} {person?.full_name ?? "a peer"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {formatSessionDate(date)}
                  {request.preferred_time ? ` · ${request.preferred_time}` : ""}
                </span>
                {request.offering ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <FormatIcon className="size-3.5" aria-hidden="true" /> {request.offering.format}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {request.offering.session_duration} min
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChat(request)}
            >
              Open chat
            </Button>
          </article>
        );
      })}
    </div>
  );
}
