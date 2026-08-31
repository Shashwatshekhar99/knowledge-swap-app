import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchActiveOfferings,
  fetchOpenAvailability,
  formatSessionDate,
  friendlyError,
  isSlotTaken,
  nextDatesForWeekday,
  toISODate,
  weekdayLabel,
  type AvailabilitySlotWithProvider,
  type OfferingWithProvider,
  type RequestWithDetails,
} from "@/lib/skillswap";

export function SlotBooking({
  currentUserId,
  requests,
  limit = 6,
}: {
  currentUserId: string;
  requests: RequestWithDetails[];
  limit?: number | undefined;
}) {
  const [booking, setBooking] = useState<AvailabilitySlotWithProvider | null>(null);

  const slots = useQuery({
    queryKey: ["open-availability"],
    queryFn: fetchOpenAvailability,
  });
  const offerings = useQuery({
    queryKey: ["active-offerings"],
    queryFn: fetchActiveOfferings,
  });

  const offeringsByProvider = useMemo(() => {
    const map = new Map<string, OfferingWithProvider[]>();
    for (const offering of offerings.data ?? []) {
      const list = map.get(offering.provider_id) ?? [];
      list.push(offering);
      map.set(offering.provider_id, list);
    }
    return map;
  }, [offerings.data]);

  const bookable = (slots.data ?? [])
    .filter((slot) => slot.provider_id !== currentUserId)
    .filter((slot) => (offeringsByProvider.get(slot.provider_id) ?? []).length > 0)
    .slice(0, limit);

  if (slots.isLoading || offerings.isLoading) return <RowSkeleton count={3} />;
  if (slots.isError) {
    return <p className="text-sm text-destructive">We couldn&apos;t load open slots right now.</p>;
  }

  if (bookable.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No open slots right now."
        description="When peers publish weekly availability, you can book a time here in one step."
      />
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {bookable.map((slot) => {
          const nextDate = nextDatesForWeekday(slot.weekday, 1)[0]!;
          return (
            <li
              key={slot.id}
              className="card-surface flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <UserAvatar profile={slot.provider} className="size-10" />
                <div>
                  <p className="text-sm font-semibold">{slot.provider?.full_name ?? "A peer"}</p>
                  <p className="text-xs text-muted-foreground">
                    Every {weekdayLabel(slot.weekday)} · {slot.start_time} ·{" "}
                    {slot.duration_minutes} min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="rounded-lg">
                  Next {formatSessionDate(nextDate)}
                </Badge>
                <Button className="rounded-xl" size="sm" onClick={() => setBooking(slot)}>
                  Book slot
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <BookSlotDialog
        slot={booking}
        currentUserId={currentUserId}
        requests={requests}
        offerings={booking ? (offeringsByProvider.get(booking.provider_id) ?? []) : []}
        onOpenChange={(open) => !open && setBooking(null)}
      />
    </>
  );
}

function BookSlotDialog({
  slot,
  currentUserId,
  requests,
  offerings,
  onOpenChange,
}: {
  slot: AvailabilitySlotWithProvider | null;
  currentUserId: string;
  requests: RequestWithDetails[];
  offerings: OfferingWithProvider[];
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [offeringId, setOfferingId] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [message, setMessage] = useState("");

  const dates = slot ? nextDatesForWeekday(slot.weekday, 4) : [];
  const selectedOffering = offerings.find((offering) => offering.id === offeringId);

  const book = useMutation({
    mutationFn: async () => {
      if (!slot || !selectedOffering) return;
      const { error } = await supabase.from("session_requests").insert({
        offering_id: selectedOffering.id,
        requester_id: currentUserId,
        provider_id: slot.provider_id,
        message: message.trim(),
        preferred_date: dateValue,
        preferred_time: slot.start_time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot booked — the provider just needs to confirm.");
      void queryClient.invalidateQueries();
      onOpenChange(false);
      setOfferingId("");
      setDateValue("");
      setMessage("");
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!slot) return;
    if (!offeringId) {
      toast.error("Pick which skill you'd like to learn.");
      return;
    }
    if (!dateValue) {
      toast.error("Pick a date for the session.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Add a short note (at least 10 characters) about what you need.");
      return;
    }
    if (isSlotTaken(requests, slot.provider_id, dateValue, slot.start_time)) {
      toast.error("You already have a session booked with this peer at that time.");
      return;
    }
    book.mutate();
  }

  return (
    <Dialog open={!!slot} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book this slot</DialogTitle>
            <DialogDescription>
              {slot
                ? `${slot.provider?.full_name ?? "A peer"} · ${weekdayLabel(slot.weekday)}s at ${slot.start_time}`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slot-offering">What do you want to learn?</Label>
              <Select value={offeringId} onValueChange={setOfferingId}>
                <SelectTrigger id="slot-offering" className="w-full rounded-xl">
                  <SelectValue placeholder="Choose a skill" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((offering) => (
                    <SelectItem key={offering.id} value={offering.id}>
                      {offering.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-date">Which week?</Label>
              <Select value={dateValue} onValueChange={setDateValue}>
                <SelectTrigger id="slot-date" className="w-full rounded-xl">
                  <SelectValue placeholder="Choose a date" />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((date) => {
                    const iso = toISODate(date);
                    const taken = slot
                      ? isSlotTaken(requests, slot.provider_id, iso, slot.start_time)
                      : false;
                    return (
                      <SelectItem key={iso} value={iso} disabled={taken}>
                        {formatSessionDate(date)}
                        {taken ? " · already booked" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-message">Note for the provider</Label>
              <Textarea
                id="slot-message"
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'd love help preparing for my data structures interview."
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" className="w-full rounded-xl" disabled={book.isPending}>
              {book.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Booking...
                </>
              ) : (
                "Confirm booking"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
