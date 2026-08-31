import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { SkillForm, type SkillFormValues } from "@/components/SkillForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchOffering, friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/edit-skill/$id")({
  head: () => ({
    meta: [
      { title: "Edit skill — SkillSwap" },
      { name: "description", content: "Update the details of your SkillSwap offering." },
      { property: "og:title", content: "Edit skill — SkillSwap" },
      { property: "og:description", content: "Update the details of your SkillSwap offering." },
    ],
  }),
  component: EditSkillPage,
});

function EditSkillPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const offeringQuery = useQuery({ queryKey: ["offering", id], queryFn: () => fetchOffering(id) });

  const mutation = useMutation({
    mutationFn: async (values: SkillFormValues) => {
      const { error } = await supabase
        .from("skill_offerings")
        .update({
          title: values.title,
          category: values.category,
          description: values.description,
          what_youll_learn: values.what_youll_learn || null,
          experience: values.experience || null,
          session_duration: values.session_duration,
          format: values.format,
          availability: values.availability || null,
          price: values.price,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skill updated.");
      queryClient.invalidateQueries();
      navigate({ to: "/my-skills" });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  if (offeringQuery.isLoading) {
    return (
      <main className="container-page max-w-3xl space-y-4 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </main>
    );
  }

  const offering = offeringQuery.data;
  if (!offering || offering.provider_id !== user!.id) {
    return (
      <main className="container-page py-16">
        <EmptyState
          icon={SearchX}
          title="You can only edit your own offerings."
          description="This skill either doesn't exist or belongs to another student."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/my-skills">Back to My Skills</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="container-page max-w-3xl py-8 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Edit your skill</h1>
      <p className="mt-2 text-muted-foreground">Keep the details fresh so peers know what to expect.</p>

      <div className="mt-8">
        <SkillForm
          initialValues={{
            title: offering.title,
            category: offering.category,
            description: offering.description,
            what_youll_learn: offering.what_youll_learn ?? "",
            experience: offering.experience ?? "",
            session_duration: offering.session_duration,
            format: offering.format,
            availability: offering.availability ?? "",
            price: Number(offering.price),
          }}
          submitLabel="Save changes"
          pending={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
          onCancel={() => navigate({ to: "/my-skills" })}
        />
      </div>
    </main>
  );
}
