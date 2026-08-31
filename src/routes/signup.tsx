import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/skillswap";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — SkillSwap" },
      {
        name: "description",
        content: "Join SkillSwap to learn from student peers and share the skills you already have.",
      },
      { property: "og:title", content: "Create your account — SkillSwap" },
      {
        property: "og:description",
        content: "Join SkillSwap to learn from student peers and share the skills you already have.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !college.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), college: college.trim(), bio: bio.trim() },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      return;
    }
    toast.success("Welcome to SkillSwap!");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="container-page py-6">
        <Logo />
      </div>
      <main className="container-page flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-md">
          {checkEmail ? (
            <div className="card-surface p-8 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
                SkillSwap account, then log in.
              </p>
              <Button asChild className="mt-6 rounded-xl">
                <Link to="/login">Go to login</Link>
              </Button>
            </div>
          ) : (
            <div className="card-surface p-7 sm:p-9">
              <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Learn a skill, share a skill. Both take minutes.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    placeholder="Aditi Rao"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@college.edu"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
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
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College / University *</Label>
                  <Input
                    id="college"
                    value={college}
                    onChange={(event) => setCollege(event.target.value)}
                    placeholder="St. Xavier's College, Mumbai"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Short bio (optional)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={3}
                    placeholder="Second-year economics student who loves spreadsheets."
                    className="rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Creating
                      account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
