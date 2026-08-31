import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CalendarDays, Clock, Inbox, MessagesSquare, Plus, Sparkles, Star, Video, MapPin, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { ChatHistory } from "@/components/ChatHistory";
import { EmptyState } from "@/components/EmptyState";
import { RequestSessionDialog } from "@/components/RequestSessionDialog";
import { SessionCalendar } from "@/components/SessionCalendar";
import { SessionChatDialog } from "@/components/SessionChatDialog";
import { UpcomingSessions } from "@/components/UpcomingSessions";
import { SkillCard } from "@/components/SkillCard";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { RowSkeleton, SkillGridSkeleton, StatsSkeleton } from "@/components/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  fetchActiveOfferings,
  fetchMessagesForRequests,
  fetchMyOfferings,
  fetchMyRequests,
  fetchProviderStats,
  firstNameOf,
  upcomingSessions,
  type OfferingWithProvider,
  type RequestWithDetails,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SkillSwap" },
      { name: "description", content: "Your SkillSwap activity: skills offered, requests and ratings." },
      { property: "og:title", content: "Dashboard — SkillSwap" },
      { property: "og:description", content: "Your SkillSwap activity: skills offered, requests and ratings." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const userId = user!.id;
  const [requesting, setRequesting] = useState<OfferingWithProvider | null>(null);
  const [chatRequest, setChatRequest] = useState<RequestWithDetails | null>(null);

  const myOfferings = useQuery({
    queryKey: ["my-offerings", userId],
    queryFn: () => fetchMyOfferings(userId),
  });
  const requests = useQuery({
    queryKey: ["requests", userId],
    queryFn: () => fetchMyRequests(userId),
  });
  const offerings = useQuery({ queryKey: ["offerings"], queryFn: fetchActiveOfferings });
  const chatRequestIds = (requests.data ?? [])
    .filter((request) => request.status === "accepted" || request.status === "completed")
    .map((request) => request.id);
  const messages = useQuery({
    queryKey: ["dashboard-messages", userId, chatRequestIds.join(",")],
    enabled: chatRequestIds.length > 0,
    queryFn: () => fetchMessagesForRequests(chatRequestIds),
  });
  const stats = useQuery({ queryKey: ["provider-stats"], queryFn: fetchProviderStats });

  const activeSkills = (myOfferings.data ?? []).filter((o) => o.is_active);
  const pendingCount = (requests.data ?? []).filter((r) => r.status === "pending").length;
  const completedCount = (requests.data ?? []).filter((r) => r.status === "completed").length;
  const myStats = stats.data?.[userId];

  const recommended = (offerings.data ?? []).filter((o) => o.provider_id !== userId).slice(0, 6);
  const recentRequests = (requests.data ?? []).slice(0, 5);
  const upcoming = upcomingSessions(requests.data ?? []);

  return (
    <main className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {firstNameOf(profile?.full_name)} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">Here&apos;s what&apos;s happening with your skills.</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/create-skill">
            <Plus className="size-4" aria-hidden="true" /> Share a Skill
          </Link>
        </Button>
      </div>

      <section className="mt-8" aria-label="Your statistics">
        {myOfferings.isLoading || requests.isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Sparkles} label="Skills Offered" value={activeSkills.length} hint="Active offerings" />
            <StatCard
              icon={CalendarClock}
              label="Upcoming Sessions"
              value={upcoming.length}
              hint={pendingCount ? `${pendingCount} pending request(s)` : "Scheduled and accepted"}
            />
            <StatCard icon={CheckCircle2} label="Sessions Completed" value={completedCount} />
            <StatCard
              icon={Star}
              label="Average Rating"
              value={myStats?.rating ? myStats.rating.toFixed(1) : "—"}
              hint={myStats?.reviewCount ? `${myStats.reviewCount} review(s)` : "No reviews yet"}
            />
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="upcoming-sessions-heading">
          <div className="flex items-center justify-between">
            <h2 id="upcoming-sessions-heading" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
              <CalendarClock className="size-5 text-accent" aria-hidden="true" /> Upcoming Sessions
            </h2>
            <Link to="/requests" className="text-sm font-semibold text-accent hover:underline">
              Manage requests
            </Link>
          </div>
          <div className="mt-4">
            {requests.isLoading ? (
              <RowSkeleton count={2} />
            ) : (
              <UpcomingSessions
                requests={requests.data ?? []}
                currentUserId={userId}
                onOpenChat={setChatRequest}
              />
            )}
          </div>
        </section>

        <section aria-labelledby="chat-history-heading">
          <div className="flex items-center justify-between">
            <h2 id="chat-history-heading" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
              <MessagesSquare className="size-5 text-accent" aria-hidden="true" /> Chat History
            </h2>
          </div>
          <div className="mt-4">
            <ChatHistory
              requests={requests.data ?? []}
              messages={messages.data ?? []}
              loading={requests.isLoading || messages.isLoading}
              currentUserId={userId}
              onOpenChat={setChatRequest}
            />
          </div>
        </section>
      </div>

      <section className="mt-12" aria-labelledby="calendar-heading">
        <h2 id="calendar-heading" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
          <CalendarDays className="size-5 text-accent" aria-hidden="true" /> Session Calendar
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dates with a scheduled peer session are highlighted.
        </p>
        <div className="mt-4">
          {requests.isLoading ? (
            <RowSkeleton count={3} />
          ) : (
            <SessionCalendar
              requests={requests.data ?? []}
              currentUserId={userId}
              onOpenChat={setChatRequest}
            />
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="active-skills-heading">
          <div className="flex items-center justify-between">
            <h2 id="active-skills-heading" className="text-xl font-bold tracking-tight">
              Your Active Skills
            </h2>
            <Link to="/my-skills" className="text-sm font-semibold text-accent hover:underline">
              View all skills
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {myOfferings.isLoading ? (
              <RowSkeleton count={2} />
            ) : activeSkills.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="You haven't shared a skill yet."
                description="Publish your first offering and let peers find you."
                action={
                  <Button asChild className="rounded-xl">
                    <Link to="/create-skill">Share your first skill</Link>
                  </Button>
                }
              />
            ) : (
              activeSkills.slice(0, 3).map((skill) => {
                const FormatIcon = skill.format === "In Person" ? MapPin : Video;
                return (
                  <article key={skill.id} className="card-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          to="/skills/$id"
                          params={{ id: skill.id }}
                          className="text-base font-bold transition-colors hover:text-accent"
                        >
                          {skill.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="rounded-full">
                            {skill.category}
                          </Badge>
                          <span className="inline-flex items-center gap-1">
                            <FormatIcon className="size-3.5" aria-hidden="true" /> {skill.format}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" aria-hidden="true" /> {skill.session_duration} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                            {myStats?.rating ? myStats.rating.toFixed(1) : "New"}
                          </span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="rounded-xl">
                        <Link to="/edit-skill/$id" params={{ id: skill.id }}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section aria-labelledby="recent-requests-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-requests-heading" className="text-xl font-bold tracking-tight">
              Recent Requests
            </h2>
            <Link to="/requests" className="text-sm font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {requests.isLoading ? (
              <RowSkeleton count={3} />
            ) : recentRequests.length === 0 ? (
              <EmptyState icon={Inbox} title="No requests yet." description="Requests you send or receive will show up here." />
            ) : (
              recentRequests.map((request) => {
                const incoming = request.provider_id === userId;
                const person = incoming ? request.requester : request.provider;
                return (
                  <div key={request.id} className="card-surface flex items-center gap-3 p-4">
                    <UserAvatar name={person?.full_name} url={person?.avatar_url} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{person?.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {request.offering?.title ?? "Skill removed"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={request.status} />
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="mt-12" aria-labelledby="recommended-heading">
        <div className="flex items-center justify-between">
          <h2 id="recommended-heading" className="text-xl font-bold tracking-tight">
            Recommended Skills
          </h2>
          <Link to="/explore" className="text-sm font-semibold text-accent hover:underline">
            Explore all
          </Link>
        </div>
        <div className="mt-4">
          {offerings.isLoading ? (
            <SkillGridSkeleton count={3} />
          ) : recommended.length === 0 ? (
            <EmptyState icon={Sparkles} title="No skills to recommend yet." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((offering) => (
                <SkillCard
                  key={offering.id}
                  offering={offering}
                  stats={stats.data?.[offering.provider_id]}
                  onRequest={setRequesting}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <SessionChatDialog
        request={chatRequest}
        currentUserId={userId}
        onOpenChange={(open) => !open && setChatRequest(null)}
      />
      <RequestSessionDialog
        offering={requesting}
        currentUserId={userId}
        onOpenChange={(open) => !open && setRequesting(null)}
      />
    </main>
  );
}
