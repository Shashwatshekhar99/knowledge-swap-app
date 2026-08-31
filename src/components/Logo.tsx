import { Link } from "@tanstack/react-router";

import logoMark from "@/assets/skillswap-logo.png";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string | undefined }) {
  return (
    <img
      src={logoMark}
      alt=""
      aria-hidden="true"
      width={1024}
      height={1024}
      className={cn("size-9 object-contain", className)}
    />
  );
}

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="SkillSwap home"
    >
      <LogoMark className="size-9 transition-transform group-hover:-rotate-6" />
      <span className="text-lg font-extrabold tracking-tight">SkillSwap</span>
    </Link>
  );
}
