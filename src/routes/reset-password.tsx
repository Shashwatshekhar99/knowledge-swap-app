import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — SkillSwap" },
      { name: "description", content: "Choose a new password for your SkillSwap account." },
      { property: "og:title", content: "Reset your password — SkillSwap" },
      { property: "og:description", content: "Choose a new password for your SkillSwap account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Password updated. You're all set.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="container-page py-6">
        <Logo />
      </div>
      <main className="container-page flex flex-1 items-center justify-center pb-16">
        <form onSubmit={handleSubmit} className="card-surface w-full max-w-md p-8" noValidate>
          <h1 className="text-2xl font-extrabold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a password you haven&apos;t used before.
          </p>
          <div className="mt-6 space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="rounded-xl"
              required
            />
          </div>
          <Button type="submit" className="mt-6 w-full rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
