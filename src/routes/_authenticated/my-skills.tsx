import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Plus, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { EmptyState } from "@/components/EmptyState";
import { RowSkeleton } from "@/components/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMyOfferings, formatPrice, friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/my-skills")({
  head: () => ({
    meta: [
      { title: "My skills — SkillSwap" },
      { name: "description", content: "Manage the skills you teach: edit, pause or delete your offerings." },
      { property: "og:title", content: "My skills — SkillSwap" },
      { property: "og:description", content: "Manage the skills you teach: edit, pause or delete your offerings." },
    ],
  }),
  component: MySkillsPage,
});

function MySkillsPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const offerings = useQuery({
    queryKey: ["my-offerings", userId],
    queryFn: () => fetchMyOfferings(userId),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("skill_offerings")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isActive ? "Skill is live again." : "Skill paused.");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_offerings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skill offering deleted.");
      setDeleteId(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const list = offerings.data ?? [];

  return (
    <main className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My Skills</h1>
          <p className="mt-2 text-muted-foreground">
            {list.length} offering{list.length === 1 ? "" : "s"} · {list.filter((o) => o.is_active).length} active
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/create-skill">
            <Plus className="size-4" aria-hidden="true" /> Add a Skill
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {offerings.isLoading ? (
          <RowSkeleton count={3} />
        ) : offerings.isError ? (
          <EmptyState
            icon={Sparkles}
            title="We couldn't load your skills."
            description={friendlyError(offerings.error)}
            action={
              <Button className="rounded-xl" onClick={() => offerings.refetch()}>
                Try again
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="You haven't shared a skill yet."
            description="Publish your first offering — someone is looking for exactly what you know."
            action={
              <Button asChild className="rounded-xl">
                <Link to="/create-skill">Share your first skill</Link>
              </Button>
            }
          />
        ) : (
          list.map((skill) => {
            const FormatIcon = skill.format === "In Person" ? MapPin : Video;
            return (
              <article key={skill.id} className="card-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/skills/$id"
                        params={{ id: skill.id }}
                        className="text-base font-bold transition-colors hover:text-accent"
                      >
                        {skill.title}
                      </Link>
                      <Badge variant="secondary" className="rounded-full">
                        {skill.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          skill.is_active
                            ? "rounded-full border-success/40 text-success"
                            : "rounded-full text-muted-foreground"
                        }
                      >
                        {skill.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                      {skill.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden="true" /> {skill.session_duration} min
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FormatIcon className="size-3.5" aria-hidden="true" /> {skill.format}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(Number(skill.price))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-xl">
                      <Link to="/edit-skill/$id" params={{ id: skill.id }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({ id: skill.id, isActive: !skill.is_active })
                      }
                    >
                      {skill.is_active ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(skill.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </main>
  );
}
