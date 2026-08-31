import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessagesSquare,
  Repeat,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { SessionChatDialog } from "@/components/SessionChatDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  fetchMessagesForRequests,
  fetchMyAvailability,
  fetchMyRequests,
  isSameDay,
  scheduledSessions,
  sessionDateOf,
  toISODate,
  weekdayLabel,
  type AvailabilitySlot,
  type RequestWithDetails,
  type SessionMessage,
} from "@/lib/skillswap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — SkillSwap" },
      {
        name: "description",
        content: "A month view of your booked peer sessions, chats and weekly availability slots.",
      },
      { property: "og:title", content: "Calendar — SkillSwap" },
      {
        property: "og:description",
        content: "A month view of your booked peer sessions, chats and weekly availability slots.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function CalendarPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(today);
  const [chatRequest, setChatRequest] = useState<RequestWithDetails | null>(null);

  const requests = useQuery({
    queryKey: ["my-requests", userId],
    queryFn: () => fetchMyRequests(userId),
  });
  const availability = useQuery({
    queryKey: ["availability", userId],
    queryFn: () => fetchMyAvailability(userId),
  });

  const sessions = useMemo(
    () => scheduledSessions(requests.data ?? []),
    [requests.data],
  );
  const chatIds = sessions.map((request) => request.id);
  const messages = useQuery({
    queryKey: ["session-messages", chatIds],
    enabled: chatIds.length > 0,
    queryFn: () => fetchMessagesForRequests(chatIds),
  });

  const openSlots = (availability.data ?? []).filter((slot) => slot.is_open);
  const days = useMemo(() => buildMonthGrid(month), [month]);

  const messagesByDay = useMemo(() => {
    const map = new Map<string, SessionMessage[]>();
    for (const message of messages.data ?? []) {
      const key = toISODate(new Date(message.created_at));
      map.set(key, [...(map.get(key) ?? []), message]);
    }
    return map;
  }, [messages.data]);

  function sessionsOn(day: Date) {
    return sessions.filter((request) => isSameDay(sessionDateOf(request)!, day));
  }
  function slotsOn(day: Date): AvailabilitySlot[] {
    return openSlots.filter((slot) => slot.weekday === day.getDay());
  }
  function messagesOn(day: Date) {
    return messagesByDay.get(toISODate(day)) ?? [];
  }

  const loading = requests.isLoading || availability.isLoading;
  const daySessions = sessionsOn(selected);
  const daySlots = slotsOn(selected);
  const dayMessages = messagesOn(selected);

  return (
    <div className="container-page py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <CalendarDays className="size-6 text-accent" aria-hidden="true" /> Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every booked session, recent chat and open planner slot in one month view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span className="min-w-40 text-center text-sm font-semibold">
            {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setMonth(startOfMonth(today));
              setSelected(today);
            }}
          >
            Today
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="mt-6">
          <RowSkeleton count={5} />
        </div>
      ) : requests.isError ? (
        <p className="mt-6 text-sm text-destructive">We couldn&apos;t load your calendar.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="card-surface p-3 sm:p-5">
            <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {WEEK_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const inMonth = day.getMonth() === month.getMonth();
                const daySessionCount = sessionsOn(day).length;
                const daySlotCount = slotsOn(day).length;
                const dayMessageCount = messagesOn(day).length;
                const isSelected = isSameDay(day, selected);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelected(day)}
                    aria-label={`${day.toDateString()}, ${daySessionCount} sessions`}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-h-18 flex-col items-start gap-1 rounded-xl border border-transparent p-2 text-left transition hover:border-border hover:bg-secondary/60",
                      !inMonth && "opacity-40",
                      isSelected && "border-accent bg-accent-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isSameDay(day, today) && "text-accent",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {daySessionCount > 0 ? (
                        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                          {daySessionCount} session{daySessionCount > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {daySlotCount > 0 ? (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {daySlotCount} slot{daySlotCount > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {dayMessageCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          <MessagesSquare className="size-2.5" aria-hidden="true" />
                          {dayMessageCount}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <h2 className="text-sm font-bold">
                {selected.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <div className="mt-3 space-y-3">
                {daySessions.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="No sessions this day."
                    description="Booked sessions with a date show up here."
                  />
                ) : (
                  daySessions.map((request) => {
                    const teaching = request.provider_id === userId;
                    const person = teaching ? request.requester : request.provider;
                    return (
                      <div key={request.id} className="card-surface space-y-2 p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={person?.full_name}
                            url={person?.avatar_url}
                            className="size-9"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {request.offering?.title ?? "Skill removed"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {teaching ? "Teaching" : "Learning from"}{" "}
                              {person?.full_name ?? "a peer"}
                              {request.preferred_time ? ` · ${request.preferred_time}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={request.status} />
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setChatRequest(request)}
                          >
                            Open chat
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <Repeat className="size-4 text-accent" aria-hidden="true" /> Planner slots
              </h2>
              <div className="mt-3 space-y-2">
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no open availability on {weekdayLabel(selected.getDay())}s.
                  </p>
                ) : (
                  daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                        {slot.start_time}
                      </span>
                      <Badge variant="secondary" className="rounded-lg">
                        {slot.duration_minutes} min
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <MessagesSquare className="size-4 text-accent" aria-hidden="true" /> Chats this day
              </h2>
              <div className="mt-3 space-y-2">
                {dayMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages sent on this day.</p>
                ) : (
                  dayMessages.slice(0, 5).map((message) => {
                    const request = sessions.find((item) => item.id === message.request_id);
                    return (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => request && setChatRequest(request)}
                        className="w-full rounded-xl border border-border p-3 text-left transition hover:bg-secondary/60"
                      >
                        <p className="truncate text-sm font-semibold">
                          {request?.offering?.title ?? "Session chat"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {message.sender_id === userId ? "You: " : ""}
                          {message.body}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {chatRequest ? (
        <SessionChatDialog
          request={chatRequest}
          currentUserId={userId}
          onOpenChange={(open) => !open && setChatRequest(null)}
        />
      ) : null}
    </div>
  );
}
