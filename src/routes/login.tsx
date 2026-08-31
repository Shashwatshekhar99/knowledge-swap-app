import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — SkillSwap" },
      { name: "description", content: "Log in to SkillSwap to explore peer skills and manage your sessions." },
      { property: "og:title", content: "Log in — SkillSwap" },
      { property: "og:description", content: "Log in to SkillSwap to explore peer skills and manage your sessions." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyError(error, "Email or password is incorrect."));
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      toast.error("Enter your email first, then tap forgot password.");
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Password reset link sent. Check your inbox.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="container-page py-6">
        <Logo />
      </div>
      <main className="container-page flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-md">
          <div className="card-surface p-7 sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log in to keep learning and teaching.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@college.edu"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {resetting ? "Sending..." : "Forgot password?"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-xl pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to SkillSwap?{" "}
              <Link to="/signup" className="font-semibold text-accent hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Demo account</p>
            <p className="mt-1">demo@skillswap.app · Demo@12345</p>
          </div>
        </div>
      </main>
    </div>
  );
}
