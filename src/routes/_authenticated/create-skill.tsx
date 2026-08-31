import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { EMPTY_SKILL, SkillForm, type SkillFormValues } from "@/components/SkillForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/create-skill")({
  head: () => ({
    meta: [
      { title: "Share a skill — SkillSwap" },
      { name: "description", content: "Publish a skill offering and help a peer learn something you already know." },
      { property: "og:title", content: "Share a skill — SkillSwap" },
      { property: "og:description", content: "Publish a skill offering and help a peer learn something you already know." },
    ],
  }),
  component: CreateSkillPage,
});

function CreateSkillPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: SkillFormValues) => {
      const { error } = await supabase.from("skill_offerings").insert({
        provider_id: user!.id,
        title: values.title,
        category: values.category,
        description: values.description,
        what_youll_learn: values.what_youll_learn || null,
        experience: values.experience || null,
        session_duration: values.session_duration,
        format: values.format,
        availability: values.availability || null,
        price: values.price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skill published! Peers can find it now.");
      queryClient.invalidateQueries();
      navigate({ to: "/my-skills" });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <main className="container-page max-w-3xl py-8 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Share what you know.</h1>
      <p className="mt-2 text-muted-foreground">
        Someone out there is looking for exactly what you already know.
      </p>

      <div className="mt-8">
        <SkillForm
          initialValues={EMPTY_SKILL}
          submitLabel="Publish Skill"
          pending={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
          onCancel={() => navigate({ to: "/my-skills" })}
        />
      </div>
    </main>
  );
}
