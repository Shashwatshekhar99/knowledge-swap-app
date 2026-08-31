import { STATUS_LABELS } from "@/lib/skillswap";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground ring-warning/30",
  accepted: "bg-success/15 text-foreground ring-success/40",
  completed: "bg-info/15 text-foreground ring-info/40",
  declined: "bg-destructive/10 text-foreground ring-destructive/30",
  cancelled: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        STYLES[status] ?? STYLES["cancelled"],
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
