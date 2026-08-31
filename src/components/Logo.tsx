import { Link } from "@tanstack/react-router";
import { Repeat2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="SkillSwap home"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm transition-transform group-hover:-rotate-6">
        <Repeat2 className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">SkillSwap</span>
    </Link>
  );
}
