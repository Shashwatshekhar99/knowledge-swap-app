import { CATEGORIES } from "@/lib/skillswap";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["All", ...CATEGORIES.filter((c) => c !== "Other"), "Other"];
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
