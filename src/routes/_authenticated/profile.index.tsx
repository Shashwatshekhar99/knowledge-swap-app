import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { RatingStars } from "@/components/RatingStars";
import { SkillCard } from "@/components/SkillCard";
import { StatCard } from "@/components/StatCard";
import { UserAvatar } from "@/components/UserAvatar";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  fetchMyOfferings,
  fetchMyRequests,
  fetchProviderStats,
  fetchReviewsFor,
  friendlyError,
  type OfferingWithProvider,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({
    meta: [
      { title: "My profile — SkillSwap" },
      { name: "description", content: "Update your SkillSwap profile and see your teaching reputation." },
      { property: "og:title", content: "My profile — SkillSwap" },
      { property: "og:description", content: "Update your SkillSwap profile and see your teaching reputation." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile } = useAuth();
  const userId = user!.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    college: profile?.college ?? "",
    bio: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });

  const offerings = useQuery({
    queryKey: ["my-offerings", userId],
    queryFn: () => fetchMyOfferings(userId),
  });
  const requests = useQuery({ queryKey: ["requests", userId], queryFn: () => fetchMyRequests(userId) });
  const stats = useQuery({ queryKey: ["provider-stats"], queryFn: fetchProviderStats });
  const reviews = useQuery({ queryKey: ["reviews-for", userId], queryFn: () => fetchReviewsFor(userId) });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          college: form.college.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated.");
      setEditing(false);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const myStats = stats.data?.[userId];
  const completed = (requests.data ?? []).filter((request) => request.status === "completed").length;
  const activeOfferings = (offerings.data ?? []).filter((offering) => offering.is_active);

  return (
    <main className="container-page py-8 sm:py-10">
      <section className="card-surface p-6 sm:p-8">
        {editing ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (form.full_name.trim().length < 2) {
                toast.error("Please enter your full name.");
                return;
              }
              mutation.mutate();
            }}
          >
            <h1 className="text-2xl font-extrabold tracking-tight">Edit profile</h1>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  className="rounded-xl"
                  value={form.full_name}
                  onChange={(event) => setForm((f) => ({ ...f, full_name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  className="rounded-xl"
                  value={form.college}
                  onChange={(event) => setForm((f) => ({ ...f, college: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar image URL</Label>
              <Input
                id="avatar_url"
                className="rounded-xl"
                placeholder="https://..."
                value={form.avatar_url}
                onChange={(event) => setForm((f) => ({ ...f, avatar_url: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                className="rounded-xl"
                value={form.bio}
                onChange={(event) => setForm((f) => ({ ...f, bio: event.target.value }))}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                name={profile?.full_name}
                url={profile?.avatar_url}
                className="size-20 text-xl"
              />
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {profile?.full_name ?? "Your profile"}
                </h1>
                <p className="text-sm text-muted-foreground">{profile?.college ?? "Add your college"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
                <div className="mt-2">
                  <RatingStars value={myStats?.rating ?? 0} count={myStats?.reviewCount} />
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setForm({
                  full_name: profile?.full_name ?? "",
                  college: profile?.college ?? "",
                  bio: profile?.bio ?? "",
                  avatar_url: profile?.avatar_url ?? "",
                });
                setEditing(true);
              }}
            >
              Edit profile
            </Button>
          </div>
        )}

        {!editing && profile?.bio ? (
          <p className="mt-6 whitespace-pre-line border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        ) : null}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Sparkles} label="Active Skills" value={activeOfferings.length} />
        <StatCard icon={Star} label="Sessions Completed" value={completed} />
        <StatCard
          icon={Star}
          label="Reviews Received"
          value={reviews.data?.length ?? 0}
          hint={myStats?.rating ? `${myStats.rating.toFixed(1)} average` : "No rating yet"}
        />
      </div>

      <section className="mt-10" aria-labelledby="my-offerings-heading">
        <h2 id="my-offerings-heading" className="text-xl font-bold tracking-tight">
          Skills you teach
        </h2>
        <div className="mt-4">
          {offerings.isLoading ? (
            <RowSkeleton count={2} />
          ) : activeOfferings.length === 0 ? (
            <EmptyState icon={Sparkles} title="No active skills yet." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeOfferings.map((offering) => (
                <SkillCard
                  key={offering.id}
                  offering={{ ...offering, provider: profile ?? null } as OfferingWithProvider}
                  stats={myStats}
                  isOwn
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-xl font-bold tracking-tight">
          Reviews about you
        </h2>
        <div className="mt-4 space-y-3">
          {reviews.isLoading ? (
            <RowSkeleton count={2} />
          ) : (reviews.data ?? []).length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet." description="Complete a session to earn your first review." />
          ) : (
            (reviews.data ?? []).map((review) => (
              <div key={review.id} className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <RatingStars value={review.rating} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-muted-foreground">“{review.comment}”</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
