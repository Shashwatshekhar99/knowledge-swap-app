import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SkillOffering = Database["public"]["Tables"]["skill_offerings"]["Row"];
export type SessionRequest = Database["public"]["Tables"]["session_requests"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type OfferingWithProvider = SkillOffering & { provider: Profile | null };
export type RequestWithDetails = SessionRequest & {
  offering: Pick<SkillOffering, "id" | "title" | "category" | "session_duration" | "format"> | null;
  requester: Profile | null;
  provider: Profile | null;
};

export const CATEGORIES = [
  "Career",
  "Consulting",
  "Finance",
  "Marketing",
  "Technology",
  "Design",
  "Academics",
  "Communication",
  "Creative",
  "Lifestyle",
  "Other",
] as const;

export const FORMATS = ["Online", "In Person", "Either"] as const;
export const DURATIONS = [30, 45, 60, 90] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
];

export function initialsOf(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function firstNameOf(name?: string | null) {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}

export function formatPrice(price: number) {
  return price > 0 ? `₹${price}` : "Free peer session";
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = (error as { message?: string })?.message ?? "";
  if (!message) return fallback;
  if (/row-level security|permission/i.test(message)) {
    return "You don't have permission to perform this action.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (/already registered|already been registered/i.test(message)) {
    return "That email is already registered. Try logging in instead.";
  }
  return message || fallback;
}

/* ---------------- Aggregates ---------------- */

export type ProviderStats = { rating: number; reviewCount: number; sessions: number };

export async function fetchProviderStats(): Promise<Record<string, ProviderStats>> {
  const [{ data: reviews, error: reviewError }, { data: requests, error: requestError }] =
    await Promise.all([
      supabase.from("reviews").select("reviewee_id, rating"),
      supabase.from("session_requests").select("provider_id, status").eq("status", "completed"),
    ]);
  if (reviewError) throw reviewError;
  if (requestError) throw requestError;

  const map: Record<string, ProviderStats> = {};
  for (const row of reviews ?? []) {
    const entry = (map[row.reviewee_id] ??= { rating: 0, reviewCount: 0, sessions: 0 });
    entry.rating += row.rating;
    entry.reviewCount += 1;
  }
  for (const key of Object.keys(map)) {
    const entry = map[key]!;
    entry.rating = entry.reviewCount ? entry.rating / entry.reviewCount : 0;
  }
  for (const row of requests ?? []) {
    const entry = (map[row.provider_id] ??= { rating: 0, reviewCount: 0, sessions: 0 });
    entry.sessions += 1;
  }
  return map;
}

/* ---------------- Queries ---------------- */

const OFFERING_SELECT = "*, provider:profiles!skill_offerings_provider_id_fkey(*)";

export async function fetchActiveOfferings(): Promise<OfferingWithProvider[]> {
  const { data, error } = await supabase
    .from("skill_offerings")
    .select(OFFERING_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OfferingWithProvider[];
}

export async function fetchOffering(id: string): Promise<OfferingWithProvider | null> {
  const { data, error } = await supabase
    .from("skill_offerings")
    .select(OFFERING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as OfferingWithProvider | null;
}

export async function fetchMyOfferings(userId: string): Promise<SkillOffering[]> {
  const { data, error } = await supabase
    .from("skill_offerings")
    .select("*")
    .eq("provider_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfileOfferings(userId: string): Promise<SkillOffering[]> {
  const { data, error } = await supabase
    .from("skill_offerings")
    .select("*")
    .eq("provider_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const REQUEST_SELECT =
  "*, offering:skill_offerings(id, title, category, session_duration, format), requester:profiles!session_requests_requester_id_fkey(*), provider:profiles!session_requests_provider_id_fkey(*)";

export async function fetchMyRequests(userId: string): Promise<RequestWithDetails[]> {
  const { data, error } = await supabase
    .from("session_requests")
    .select(REQUEST_SELECT)
    .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RequestWithDetails[];
}

export async function fetchMyReviews(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviewsFor(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- Peer ratings ---------------- */

export type PeerRating = Database["public"]["Tables"]["peer_ratings"]["Row"];
export type PeerRatingTarget = "profile" | "offering";
export type PeerRatingWithRater = PeerRating & { rater: Profile | null };

export async function fetchPeerRatings(
  targetType: PeerRatingTarget,
  targetId: string,
): Promise<PeerRatingWithRater[]> {
  const { data, error } = await supabase
    .from("peer_ratings")
    .select("*, rater:profiles!peer_ratings_rater_id_fkey(*)")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PeerRatingWithRater[];
}

export function summarizePeerRatings(ratings: { rating: number }[]) {
  if (!ratings.length) return { average: 0, count: 0 };
  const total = ratings.reduce((sum, row) => sum + row.rating, 0);
  return { average: total / ratings.length, count: ratings.length };
}

/* ---------------- Sessions & chat ---------------- */

export type SessionMessage = Database["public"]["Tables"]["session_messages"]["Row"];

export function sessionDateOf(request: SessionRequest): Date | null {
  if (!request.preferred_date) return null;
  const parts = request.preferred_date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function scheduledSessions(requests: RequestWithDetails[]) {
  return requests
    .filter((request) => request.status === "accepted" || request.status === "completed")
    .filter((request) => sessionDateOf(request) !== null)
    .sort((a, b) => (sessionDateOf(a)!.getTime() - sessionDateOf(b)!.getTime()));
}

export function upcomingSessions(requests: RequestWithDetails[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return scheduledSessions(requests).filter(
    (request) => request.status === "accepted" && sessionDateOf(request)!.getTime() >= today.getTime(),
  );
}

export function formatSessionDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export async function fetchMessagesForRequests(requestIds: string[]): Promise<SessionMessage[]> {
  if (!requestIds.length) return [];
  const { data, error } = await supabase
    .from("session_messages")
    .select("*")
    .in("request_id", requestIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ---------------- Session planner: recurring availability ---------------- */

export type AvailabilitySlot = Database["public"]["Tables"]["availability_slots"]["Row"];
export type AvailabilitySlotWithProvider = AvailabilitySlot & { provider: Profile | null };

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayLabel(weekday: number) {
  return WEEKDAYS[weekday] ?? "Day";
}

export async function fetchMyAvailability(userId: string): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("provider_id", userId)
    .order("weekday", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchOpenAvailability(): Promise<AvailabilitySlotWithProvider[]> {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*, provider:profiles!availability_slots_provider_id_fkey(*)")
    .eq("is_open", true)
    .order("weekday", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AvailabilitySlotWithProvider[];
}

/** The next N calendar dates (including today) that fall on the given weekday. */
export function nextDatesForWeekday(weekday: number, count = 4): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = (weekday - today.getDay() + 7) % 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset + index * 7);
    return date;
  });
}

export function toISODate(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Slot times already taken by a pending/accepted request with the same provider. */
export function isSlotTaken(
  requests: RequestWithDetails[],
  providerId: string,
  isoDate: string,
  time: string,
) {
  return requests.some(
    (request) =>
      request.provider_id === providerId &&
      request.preferred_date === isoDate &&
      request.preferred_time === time &&
      (request.status === "pending" || request.status === "accepted"),
  );
}
