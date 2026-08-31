import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  GraduationCap,
  Handshake,
  Search,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { RatingStars } from "@/components/RatingStars";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSwap — Learn from someone who's already been there" },
      {
        name: "description",
        content:
          "SkillSwap is a peer-to-peer skill exchange for students. Find a peer who can teach Excel, case prep, coding, design or public speaking — and share what you know.",
      },
      { property: "og:title", content: "SkillSwap — Peer-to-peer student skill exchange" },
      {
        property: "og:description",
        content:
          "Find a student peer who can teach the skills classrooms don't cover, and share what you already know.",
      },
    ],
  }),
  component: Landing,
});

const SAMPLE_SKILLS = [
  {
    title: "Excel & Financial Modelling",
    category: "Finance",
    name: "Demo Student",
    college: "SRCC, Delhi University",
    rating: 4.8,
  },
  {
    title: "Case Interview Prep",
    category: "Consulting",
    name: "Ananya Sharma",
    college: "SRCC, Delhi University",
    rating: 4.9,
  },
  {
    title: "Canva & Design",
    category: "Design",
    name: "Priya Nair",
    college: "NIFT Bengaluru",
    rating: 4.7,
  },
  {
    title: "Python Basics",
    category: "Technology",
    name: "Rohan Mehta",
    college: "IIT Bombay",
    rating: 5,
  },
  {
    title: "Public Speaking",
    category: "Communication",
    name: "Sara Iqbal",
    college: "Ashoka University",
    rating: 4.6,
  },
  {
    title: "Photography Basics",
    category: "Creative",
    name: "Kabir Singh",
    college: "Manipal Institute of Technology",
    rating: 4.8,
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Find a skill",
    body: "Browse skills offered by students across campuses and categories.",
  },
  {
    icon: CalendarCheck,
    title: "Request a session",
    body: "Tell the peer what you need help with and suggest a time that works.",
  },
  {
    icon: Handshake,
    title: "Learn together",
    body: "Connect, learn and grow — then leave a review to help the next student.",
  },
];

function Landing() {
  const { user } = useAuth();
  const primaryTo = user ? "/explore" : "/signup";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container-page py-16 sm:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge
                variant="secondary"
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
              >
                <GraduationCap className="mr-1.5 size-3.5" aria-hidden="true" />
                Built for students, by students
              </Badge>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Learn from someone who&apos;s already been there.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                SkillSwap connects students with peers who can teach the skills that classrooms
                don&apos;t always cover.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-2xl text-base">
                  <Link to={primaryTo}>
                    Explore Skills <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl text-base">
                  <Link to={user ? "/create-skill" : "/signup"}>Share a Skill</Link>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  ["13+", "skills live"],
                  ["9", "student mentors"],
                  ["Free", "peer sessions"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-2xl font-extrabold tracking-tight">{value}</dt>
                    <dd className="text-xs text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent-soft/70 blur-2xl" />
              <div className="grid gap-4 sm:grid-cols-2">
                {SAMPLE_SKILLS.map((skill, index) => (
                  <div
                    key={skill.title}
                    className={`card-surface p-4 transition-transform duration-200 hover:-translate-y-1 ${
                      index % 2 === 1 ? "sm:translate-y-6" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={skill.name} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{skill.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {skill.college}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-snug">{skill.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        {skill.category}
                      </Badge>
                      <RatingStars value={skill.rating} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-surface py-16 sm:py-20">
          <div className="container-page">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How SkillSwap works
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Three steps between “I wish someone could show me this” and actually knowing how.
            </p>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="card-surface p-6">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft">
                    <step.icon className="size-5 text-foreground" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Value props */}
        <section className="container-page py-16 sm:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Real peers, real context",
                body: "Everyone here is a student who recently learned what you're trying to learn.",
              },
              {
                icon: Sparkles,
                title: "Teach what you know",
                body: "Publish a skill in two minutes and build a track record of ratings.",
              },
              {
                icon: Handshake,
                title: "Free by default",
                body: "Most sessions are free peer exchanges. Help now, get help later.",
              },
            ].map((item) => (
              <div key={item.title} className="card-surface p-6">
                <item.icon className="size-5 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container-page pb-20">
          <div className="rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Someone on campus needs exactly what you know.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-80">
              Join SkillSwap, share one skill, and learn another. It takes about two minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="rounded-2xl text-base">
                <Link to={user ? "/dashboard" : "/signup"}>Create your account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-primary-foreground/30 bg-transparent text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to={user ? "/explore" : "/login"}>I already have one</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Learn from someone who&apos;s already been there.
          </p>
        </div>
      </footer>
    </div>
  );
}
