import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMyAvailability,
  friendlyError,
  TIME_SLOTS,
  WEEKDAYS,
  weekdayLabel,
  type AvailabilitySlot,
} from "@/lib/skillswap";

const DURATIONS = [30, 45, 60, 90, 120];

export function AvailabilityPlanner({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [weekday, setWeekday] = useState("1");
  const [time, setTime] = useState(TIME_SLOTS[0] ?? "9:00 AM");
  const [duration, setDuration] = useState("60");

  const slots = useQuery({
    queryKey: ["availability", userId],
    queryFn: () => fetchMyAvailability(userId),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["availability"] });
    void queryClient.invalidateQueries({ queryKey: ["open-availability"] });
  }

  const addSlot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("availability_slots").insert({
        provider_id: userId,
        weekday: Number(weekday),
        start_time: time,
        duration_minutes: Number(duration),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability added — it repeats every week.");
      invalidate();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const toggleSlot = useMutation({
    mutationFn: async (slot: AvailabilitySlot) => {
      const { error } = await supabase
        .from("availability_slots")
        .update({ is_open: !slot.is_open })
        .eq("id", slot.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(friendlyError(error)),
  });

  const removeSlot = useMutation({
    mutationFn: async (slot: AvailabilitySlot) => {
      const { error } = await supabase.from("availability_slots").delete().eq("id", slot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot removed.");
      invalidate();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <div className="space-y-4">
      <form
        className="card-surface grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          addSlot.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="slot-weekday">Day</Label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger id="slot-weekday" className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day, index) => (
                <SelectItem key={day} value={`${index}`}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slot-time">Start time</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger id="slot-time" className="w-full rounded-xl">
              <SelectValue />
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
        <div className="space-y-1.5">
          <Label htmlFor="slot-duration">Length</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="slot-duration" className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((minutes) => (
                <SelectItem key={minutes} value={`${minutes}`}>
                  {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="rounded-xl" disabled={addSlot.isPending}>
          {addSlot.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          Add slot
        </Button>
      </form>

      {slots.isLoading ? (
        <RowSkeleton count={2} />
      ) : slots.isError ? (
        <p className="text-sm text-destructive">We couldn&apos;t load your availability.</p>
      ) : slots.data && slots.data.length > 0 ? (
        <ul className="space-y-2">
          {slots.data.map((slot) => (
            <li
              key={slot.id}
              className="card-surface flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  Every {weekdayLabel(slot.weekday)} · {slot.start_time}
                </p>
                <p className="text-xs text-muted-foreground">{slot.duration_minutes} minute session</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={slot.is_open ? "default" : "secondary"} className="rounded-lg">
                  {slot.is_open ? "Open" : "Paused"}
                </Badge>
                <Switch
                  checked={slot.is_open}
                  onCheckedChange={() => toggleSlot.mutate(slot)}
                  aria-label={`Toggle ${weekdayLabel(slot.weekday)} ${slot.start_time} slot`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label={`Remove ${weekdayLabel(slot.weekday)} ${slot.start_time} slot`}
                  onClick={() => removeSlot.mutate(slot)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="No recurring availability yet."
          description="Add the weekly times you're free and learners can book them straight from their dashboard."
        />
      )}
    </div>
  );
}
