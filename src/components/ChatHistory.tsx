import { MessagesSquare } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import type { RequestWithDetails, SessionMessage } from "@/lib/skillswap";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatHistory({
  requests,
  messages,
  loading,
  currentUserId,
  onOpenChat,
  limit = 4,
}: {
  requests: RequestWithDetails[];
  messages: SessionMessage[];
  loading?: boolean | undefined;
  currentUserId: string;
  onOpenChat: (request: RequestWithDetails) => void;
  limit?: number | undefined;
}) {
  if (loading) return <RowSkeleton count={3} />;

  const latest = new Map<string, SessionMessage>();
  for (const message of messages) {
    const existing = latest.get(message.request_id);
    if (!existing || existing.created_at < message.created_at) {
      latest.set(message.request_id, message);
    }
  }

  const conversations = requests
    .filter((request) => latest.has(request.id))
    .sort(
      (a, b) =>
        new Date(latest.get(b.id)!.created_at).getTime() -
        new Date(latest.get(a.id)!.created_at).getTime(),
    )
    .slice(0, limit);

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No conversations yet."
        description="Chat opens up once a session request is accepted."
      />
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((request) => {
        const incoming = request.provider_id === currentUserId;
        const person = incoming ? request.requester : request.provider;
        const message = latest.get(request.id)!;
        return (
          <button
            key={request.id}
            type="button"
            onClick={() => onOpenChat(request)}
            className="card-surface flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-accent"
          >
            <UserAvatar name={person?.full_name} url={person?.avatar_url} className="size-9" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{person?.full_name ?? "Peer"}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatWhen(message.created_at)}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {message.sender_id === currentUserId ? "You: " : ""}
                {message.body}
              </p>
            </div>
            <Button asChild size="sm" variant="ghost" className="pointer-events-none rounded-xl">
              <span>Open</span>
            </Button>
          </button>
        );
      })}
    </div>
  );
}
