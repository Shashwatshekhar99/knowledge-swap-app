import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = "sm",
  showEmpty = true,
  className,
}: {
  value: number;
  count?: number | undefined;
  size?: "sm" | "md" | undefined;
  showEmpty?: boolean | undefined;
  className?: string | undefined;
}) {
  const rounded = Math.round(value * 10) / 10;
  const iconSize = size === "md" ? "size-4.5" : "size-3.5";

  if (!value && !showEmpty) return null;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              iconSize,
              i <= Math.round(value) ? "fill-warning text-warning" : "text-border",
            )}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">
        {value ? rounded.toFixed(1) : "New"}
        {count ? ` (${count})` : ""}
      </span>
      <span className="sr-only">
        {value ? `Rated ${rounded} out of 5` : "No ratings yet"}
      </span>
    </span>
  );
}

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className="rounded-md p-1 transition-transform hover:scale-110"
        >
          <Star className={cn("size-7", i <= value ? "fill-warning text-warning" : "text-border")} />
        </button>
      ))}
    </div>
  );
}
