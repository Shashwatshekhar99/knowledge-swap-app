import { LogoMark } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/skillswap";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  url,
  className,
}: {
  name?: string | null | undefined;
  url?: string | null | undefined;
  className?: string | undefined;
}) {
  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      {url ? <AvatarImage src={url} alt={name ?? "Student avatar"} /> : null}
      <AvatarFallback className="bg-accent-soft text-sm font-semibold text-foreground">
        {name ? initialsOf(name) : <LogoMark className="size-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
