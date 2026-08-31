import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { RatingStars, StarInput } from "@/components/RatingStars";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPeerRatings,
  friendlyError,
  summarizePeerRatings,
  type PeerRatingTarget,
} from "@/lib/skillswap";

export function PeerRatingPanel({
  targetType,
  targetId,
  currentUserId,
  isOwn,
  title,
  description,
}: {
  targetType: PeerRatingTarget;
  targetId: string;
  currentUserId: string;
  isOwn: boolean;
  title: string;
  description: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["peer-ratings", targetType, targetId];
  const ratingsQuery = useQuery({
    queryKey,
    queryFn: () => fetchPeerRatings(targetType, targetId),
  });

  const ratings = ratingsQuery.data ?? [];
  const summary = summarizePeerRatings(ratings);
  const mine = ratings.find((row) => row.rater_id === currentUserId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine?.id, mine?.rating, mine?.comment]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        rater_id: currentUserId,
        target_type: targetType,
        target_id: targetId,
        rating,
        comment: comment.trim() || null,
      };
      const { error } = mine
        ? await supabase
            .from("peer_ratings")
            .update({ rating: payload.rating, comment: payload.comment })
            .eq("id", mine.id)
        : await supabase.from("peer_ratings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(mine ? "Your rating was updated." : "Thanks for rating your peer!");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!mine) return;
      const { error } = await supabase.from("peer_ratings").delete().eq("id", mine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rating removed.");
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <section className="card-surface p-6" aria-labelledby={`peer-rating-${targetType}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={`peer-rating-${targetType}`} className="text-lg font-bold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <RatingStars value={summary.average} count={summary.count} size="md" />
      </div>

      {!isOwn ? (
        <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <Label>{mine ? "Update your rating" : "Rate this before you book"}</Label>
          <StarInput value={rating} onChange={setRating} />
          <Textarea
            aria-label="Rating note"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional: what makes this a good match for other students?"
            rows={3}
            className="rounded-xl bg-background"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving...
                </>
              ) : mine ? (
                "Update rating"
              ) : (
                "Submit rating"
              )}
            </Button>
            {mine ? (
              <Button
                variant="outline"
                className="rounded-xl text-destructive hover:text-destructive"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {ratingsQuery.isLoading ? (
          <RowSkeleton count={2} />
        ) : ratingsQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load peer ratings.</p>
        ) : ratings.length === 0 ? (
          <EmptyState icon={Star} title="No peer ratings yet." />
        ) : (
          ratings.map((row) => (
            <div key={row.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar
                    name={row.rater?.full_name}
                    url={row.rater?.avatar_url}
                    className="size-8 text-xs"
                  />
                  <span className="truncate text-sm font-semibold">
                    {row.rater_id === currentUserId ? "You" : (row.rater?.full_name ?? "Student")}
                  </span>
                </div>
                <RatingStars value={row.rating} />
              </div>
              {row.comment ? (
                <p className="mt-2 text-sm text-muted-foreground">“{row.comment}”</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
