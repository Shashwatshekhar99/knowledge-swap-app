import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { RequestCard } from "@/components/RequestCard";
import { ReviewModal } from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  fetchMyRequests,
  fetchMyReviews,
  friendlyError,
  type RequestWithDetails,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Requests — SkillSwap" },
      { name: "description", content: "Accept, decline and complete peer learning sessions, then leave a review." },
      { property: "og:title", content: "Requests — SkillSwap" },
      { property: "og:description", content: "Accept, decline and complete peer learning sessions, then leave a review." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState<RequestWithDetails | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requests = useQuery({
    queryKey: ["requests", userId],
    queryFn: () => fetchMyRequests(userId),
  });
  const reviews = useQuery({ queryKey: ["my-reviews", userId], queryFn: () => fetchMyReviews(userId) });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setPendingId(id);
      const { error } = await supabase.from("session_requests").update({ status }).eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      const messages: Record<string, string> = {
        accepted: "Request accepted — time to connect!",
        declined: "Request declined.",
        completed: "Session marked complete. Leave a review!",
        cancelled: "Request cancelled.",
      };
      toast.success(messages[status] ?? "Request updated.");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(friendlyError(error)),
    onSettled: () => setPendingId(null),
  });

  const all = requests.data ?? [];
  const incoming = all.filter((request) => request.provider_id === userId);
  const sent = all.filter((request) => request.requester_id === userId);
  const reviewedRequestIds = new Set(
    (reviews.data ?? []).filter((review) => review.reviewer_id === userId).map((r) => r.request_id),
  );

  function renderList(list: RequestWithDetails[], mode: "incoming" | "sent") {
    if (requests.isLoading) return <RowSkeleton count={3} />;
    if (requests.isError) {
      return (
        <EmptyState
          icon={Inbox}
          title="We couldn't load your requests."
          description={friendlyError(requests.error)}
          action={
            <Button className="rounded-xl" onClick={() => requests.refetch()}>
              Try again
            </Button>
          }
        />
      );
    }
    if (list.length === 0) {
      return mode === "incoming" ? (
        <EmptyState
          icon={Inbox}
          title="No incoming requests yet."
          description="Share more skills so peers can find and book you."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/create-skill">Share a skill</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Send}
          title="You haven't requested a session yet."
          description="Find a peer who's already been there."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/explore">Explore skills</Link>
            </Button>
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        {list.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            mode={mode}
            pending={pendingId === request.id}
            hasReviewed={reviewedRequestIds.has(request.id)}
            onUpdateStatus={(status) => statusMutation.mutate({ id: request.id, status })}
            onReview={() => setReviewing(request)}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Requests</h1>
      <p className="mt-2 text-muted-foreground">
        Manage the sessions you&apos;re teaching and the ones you&apos;ve asked for.
      </p>

      <Tabs defaultValue="incoming" className="mt-8">
        <TabsList className="rounded-xl">
          <TabsTrigger value="incoming" className="rounded-lg">
            Incoming ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-lg">
            Sent ({sent.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="mt-6">
          {renderList(incoming, "incoming")}
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          {renderList(sent, "sent")}
        </TabsContent>
      </Tabs>

      <ReviewModal
        request={reviewing}
        currentUserId={userId}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </main>
  );
}
