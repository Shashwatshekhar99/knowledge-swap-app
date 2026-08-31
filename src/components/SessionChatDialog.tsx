import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, type RequestWithDetails } from "@/lib/skillswap";

type Message = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionChatDialog({
  request,
  currentUserId,
  onOpenChange,
}: {
  request: RequestWithDetails | null;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const requestId = request?.id ?? null;

  const other =
    request && request.provider_id === currentUserId ? request.requester : request?.provider ?? null;

  const messages = useQuery({
    queryKey: ["session-messages", requestId],
    enabled: Boolean(requestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_messages")
        .select("id, request_id, sender_id, body, created_at")
        .eq("request_id", requestId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`session-messages-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["session-messages", requestId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, requestId]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("session_messages")
        .insert({ request_id: requestId!, sender_id: currentUserId, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["session-messages", requestId] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  function handleSend() {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body);
  }

  const list = messages.data ?? [];

  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan your session</DialogTitle>
          <DialogDescription>
            Chat with {other?.full_name ?? "your peer"} about{" "}
            {request?.offering?.title ?? "this session"} — share links, topics and timing.
          </DialogDescription>
        </DialogHeader>

        <div
          className="max-h-[45vh] space-y-3 overflow-y-auto rounded-xl bg-secondary/60 p-3"
          role="log"
          aria-live="polite"
        >
          {messages.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading messages…</p>
          ) : messages.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {friendlyError(messages.error)}
            </p>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messages yet — say hello and agree on what to cover.
            </p>
          ) : (
            list.map((message) => {
              const mine = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                >
                  {!mine ? (
                    <UserAvatar name={other?.full_name} url={other?.avatar_url} className="size-8" />
                  ) : null}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground border border-border"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder="Type a message…"
            aria-label="Message"
            className="resize-none rounded-xl"
          />
          <Button
            size="icon"
            className="rounded-xl"
            onClick={handleSend}
            disabled={!draft.trim() || send.isPending}
            aria-label="Send message"
          >
            {send.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
