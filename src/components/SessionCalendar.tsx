import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  formatSessionDate,
  isSameDay,
  scheduledSessions,
  sessionDateOf,
  type RequestWithDetails,
} from "@/lib/skillswap";

export function SessionCalendar({
  requests,
  currentUserId,
  onOpenChat,
}: {
  requests: RequestWithDetails[];
  currentUserId: string;
  onOpenChat: (request: RequestWithDetails) => void;
}) {
  const sessions = useMemo(() => scheduledSessions(requests), [requests]);
  const dates = useMemo(
    () => sessions.map((request) => sessionDateOf(request)!),
    [sessions],
  );
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const daySessions = selected
    ? sessions.filter((request) => isSameDay(sessionDateOf(request)!, selected))
    : [];

  return (
    <div className="card-surface p-5">
      <div className="flex flex-col gap-5 lg:flex-row">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ session: dates }}
          modifiersClassNames={{
            session: "font-bold text-accent underline underline-offset-4",
          }}
          className="mx-auto rounded-xl border border-border"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">
            {selected ? formatSessionDate(selected) : "Pick a date"}
          </h3>
          <div className="mt-3 space-y-3">
            {daySessions.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No sessions on this day."
                description="Accepted sessions with a date appear on the calendar."
              />
            ) : (
              daySessions.map((request) => {
                const incoming = request.provider_id === currentUserId;
                const person = incoming ? request.requester : request.provider;
                return (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {request.offering?.title ?? "Skill removed"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {incoming ? "Teaching" : "Learning from"} {person?.full_name ?? "a peer"}
                        {request.preferred_time ? ` · ${request.preferred_time}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.status} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => onOpenChat(request)}
                      >
                        Chat
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
