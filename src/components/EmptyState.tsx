import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
