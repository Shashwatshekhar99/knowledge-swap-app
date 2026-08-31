import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, TIME_SLOTS, type OfferingWithProvider } from "@/lib/skillswap";

export function RequestSessionDialog({
  offering,
  currentUserId,
  onOpenChange,
}: {
  offering: OfferingWithProvider | null;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [sent, setSent] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (offering) {
      setSent(false);
      setMessage("");
      setDate("");
      setTime("");
    }
  }, [offering]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!offering) return;
      const { error } = await supabase.from("session_requests").insert({
        offering_id: offering.id,
        requester_id: currentUserId,
        provider_id: offering.provider_id,
        message: message.trim(),
        preferred_date: date || null,
        preferred_time: time || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length < 10) {
      toast.error("Please tell the provider what you need help with (at least 10 characters).");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={!!offering} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-soft">
              <PartyPopper className="size-7 text-accent" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold">Request sent 🎉</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;ve sent a session request to {offering?.provider?.full_name ?? "the provider"}.
            </p>
            <Button className="mt-6 rounded-xl" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Request a session</DialogTitle>
              <DialogDescription>
                {offering?.title} · with {offering?.provider?.full_name ?? "a peer"}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-message">Tell the provider what you need help with</Label>
                <Textarea
                  id="request-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  required
                  placeholder="I'm preparing for consulting placements and would like help with market sizing."
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="request-date">Preferred date</Label>
                  <Input
                    id="request-date"
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-time">Preferred time</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger id="request-time" className="w-full rounded-xl">
                      <SelectValue placeholder="Pick a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
