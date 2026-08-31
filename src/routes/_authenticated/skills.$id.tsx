import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  IndianRupee,
  MapPin,
  SearchX,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EmptyState } from "@/components/EmptyState";
import { RatingStars } from "@/components/RatingStars";
import { RequestSessionDialog } from "@/components/RequestSessionDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  fetchOffering,
  fetchProviderStats,
  formatPrice,
  friendlyError,
  type OfferingWithProvider,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/skills/$id")({
  head: () => ({
    meta: [
      { title: "Skill details — SkillSwap" },
      { name: "description", content: "See what this peer teaches, their experience and session details." },
      { property: "og:title", content: "Skill details — SkillSwap" },
      { property: "og:description", content: "See what this peer teaches, their experience and session details." },
    ],
  }),
  component: SkillDetailPage,
});

function SkillDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const userId = user!.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [requesting, setRequesting] = useState<OfferingWithProvider | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const offeringQuery = useQuery({ queryKey: ["offering", id], queryFn: () => fetchOffering(id) });
  const stats = useQuery({ queryKey: ["provider-stats"], queryFn: fetchProviderStats });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("skill_offerings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skill offering deleted.");
      queryClient.invalidateQueries();
      navigate({ to: "/my-skills" });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  if (offeringQuery.isLoading) {
    return (
      <main className="container-page space-y-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    );
  }

  const offering = offeringQuery.data;
  if (!offering) {
    return (
      <main className="container-page py-16">
        <EmptyState
          icon={SearchX}
          title="Skill not found."
          description="This offering may have been removed or deactivated."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/explore">Back to Explore</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const provider = offering.provider;
  const providerStats = stats.data?.[offering.provider_id];
  const isOwn = offering.provider_id === userId;
  const FormatIcon = offering.format === "In Person" ? MapPin : Video;

  return (
    <main className="container-page py-8 sm:py-10">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Explore
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="rounded-full">
              {offering.category}
            </Badge>
            {!offering.is_active ? (
              <Badge variant="outline" className="ml-2 rounded-full">
                Inactive
              </Badge>
            ) : null}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {offering.title}
            </h1>
          </div>

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold">About this skill</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {offering.description}
            </p>
          </section>

          {offering.what_youll_learn ? (
            <section className="card-surface p-6">
              <h2 className="text-lg font-bold">What you&apos;ll learn</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {offering.what_youll_learn}
              </p>
            </section>
          ) : null}

          {offering.experience ? (
            <section className="card-surface p-6">
              <h2 className="text-lg font-bold">Provider experience</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {offering.experience}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <div className="flex items-center gap-3">
              <UserAvatar name={provider?.full_name} url={provider?.avatar_url} className="size-12" />
              <div className="min-w-0">
                <p className="truncate font-bold">{provider?.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{provider?.college}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <RatingStars value={providerStats?.rating ?? 0} count={providerStats?.reviewCount} />
              <span className="text-xs text-muted-foreground">
                {providerStats?.sessions ?? 0} sessions
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-xl">
              <Link to="/profile/$id" params={{ id: offering.provider_id }}>
                View profile
              </Link>
            </Button>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-lg font-bold">Session details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row icon={Clock} label="Duration" value={`${offering.session_duration} minutes`} />
              <Row icon={FormatIcon} label="Format" value={offering.format} />
              <Row
                icon={CalendarClock}
                label="Availability"
                value={offering.availability || "Flexible — ask the provider"}
              />
              <Row icon={IndianRupee} label="Price" value={formatPrice(Number(offering.price))} />
            </dl>

            {isOwn ? (
              <div className="mt-6 space-y-2">
                <Button asChild className="w-full rounded-xl">
                  <Link to="/edit-skill/$id" params={{ id: offering.id }}>
                    Edit Offering
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl text-destructive hover:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete Offering
                </Button>
              </div>
            ) : (
              <Button
                className="mt-6 w-full rounded-xl"
                size="lg"
                disabled={!offering.is_active}
                onClick={() => setRequesting(offering)}
              >
                {offering.is_active ? "Request a Session" : "Currently unavailable"}
              </Button>
            )}
          </section>
        </aside>
      </div>

      <RequestSessionDialog
        offering={requesting}
        currentUserId={userId}
        onOpenChange={(open) => !open && setRequesting(null)}
      />
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </main>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
