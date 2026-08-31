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
