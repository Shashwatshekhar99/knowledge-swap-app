import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StarInput } from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, type RequestWithDetails } from "@/lib/skillswap";

export function ReviewModal({
  request,
  currentUserId,
  onOpenChange,
}: {
  request: RequestWithDetails | null;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const revieweeIsProvider = request ? request.requester_id === currentUserId : true;
  const reviewee = revieweeIsProvider ? request?.provider : request?.requester;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const { error } = await supabase.from("reviews").insert({
        request_id: request.id,
        reviewer_id: currentUserId,
        reviewee_id: revieweeIsProvider ? request.provider_id : request.requester_id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks for helping the SkillSwap community!");
      queryClient.invalidateQueries();
      setComment("");
      setRating(5);
      onOpenChange(false);
    },
    onError: (error) => {
      const message = (error as { code?: string })?.code === "23505"
        ? "You've already reviewed this session."
        : friendlyError(error);
      toast.error(message);
    },
  });

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your session?</DialogTitle>
          <DialogDescription>
            {reviewee?.full_name
              ? `Rate your session with ${reviewee.full_name}.`
              : "Rate your session."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Your note</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share a quick note about your experience."
              rows={4}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full rounded-xl"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
