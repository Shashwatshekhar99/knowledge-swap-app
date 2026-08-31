import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Star, UserX } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton, SkillGridSkeleton } from "@/components/LoadingSkeleton";
import { PeerRatingPanel } from "@/components/PeerRatingPanel";
import { RatingStars } from "@/components/RatingStars";
import { RequestSessionDialog } from "@/components/RequestSessionDialog";
import { SkillCard } from "@/components/SkillCard";
import { StatCard } from "@/components/StatCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  fetchProfile,
  fetchProfileOfferings,
  fetchProviderStats,
  fetchReviewsFor,
  type OfferingWithProvider,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  head: () => ({
    meta: [
      { title: "Student profile — SkillSwap" },
      { name: "description", content: "See this student's skills, ratings and peer reviews on SkillSwap." },
      { property: "og:title", content: "Student profile — SkillSwap" },
      { property: "og:description", content: "See this student's skills, ratings and peer reviews on SkillSwap." },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState<OfferingWithProvider | null>(null);

  const isSelf = user?.id === id;
  useEffect(() => {
    if (isSelf) navigate({ to: "/profile", replace: true });
  }, [isSelf, navigate]);

  const profileQuery = useQuery({ queryKey: ["profile", id], queryFn: () => fetchProfile(id) });
  const offerings = useQuery({
    queryKey: ["profile-offerings", id],
    queryFn: () => fetchProfileOfferings(id),
  });
  const stats = useQuery({ queryKey: ["provider-stats"], queryFn: fetchProviderStats });
  const reviews = useQuery({ queryKey: ["reviews-for", id], queryFn: () => fetchReviewsFor(id) });

  if (profileQuery.isLoading) {
    return (
      <main className="container-page space-y-4 py-10">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <SkillGridSkeleton count={3} />
      </main>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <main className="container-page py-16">
        <EmptyState
          icon={UserX}
          title="Student not found."
          description="This profile may have been removed."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/explore">Back to Explore</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const providerStats = stats.data?.[id];

  return (
    <main className="container-page py-8 sm:py-10">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Explore
      </Link>

      <section className="card-surface mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <UserAvatar name={profile.full_name} url={profile.avatar_url} className="size-20 text-xl" />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">{profile.college ?? "Student"}</p>
          <div className="mt-2">
            <RatingStars value={providerStats?.rating ?? 0} count={providerStats?.reviewCount} />
          </div>
        </div>
      </section>

      {profile.bio ? (
        <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Sparkles} label="Skills Offered" value={offerings.data?.length ?? 0} />
        <StatCard icon={Star} label="Sessions Completed" value={providerStats?.sessions ?? 0} />
        <StatCard icon={Star} label="Reviews" value={providerStats?.reviewCount ?? 0} />
      </div>

      <section className="mt-10" aria-labelledby="their-skills-heading">
        <h2 id="their-skills-heading" className="text-xl font-bold tracking-tight">
          Skills they teach
        </h2>
        <div className="mt-4">
          {offerings.isLoading ? (
            <SkillGridSkeleton count={3} />
          ) : (offerings.data ?? []).length === 0 ? (
            <EmptyState icon={Sparkles} title="No active skills right now." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(offerings.data ?? []).map((offering) => (
                <SkillCard
                  key={offering.id}
                  offering={{ ...offering, provider: profile } as OfferingWithProvider}
                  stats={providerStats}
                  onRequest={setRequesting}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-10">
        <PeerRatingPanel
          targetType="profile"
          targetId={id}
          currentUserId={user!.id}
          isOwn={isSelf}
          title="Peer ratings"
          description="How other students rate this peer — before or after sharing a session."
        />
      </div>

      <section className="mt-10" aria-labelledby="their-reviews-heading">
        <h2 id="their-reviews-heading" className="text-xl font-bold tracking-tight">
          Peer reviews
        </h2>
        <div className="mt-4 space-y-3">
          {reviews.isLoading ? (
            <RowSkeleton count={2} />
          ) : (reviews.data ?? []).length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet." />
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

      <RequestSessionDialog
        offering={requesting}
        currentUserId={user!.id}
        onOpenChange={(open) => !open && setRequesting(null)}
      />
    </main>
  );
}
