import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { SkillGridSkeleton } from "@/components/LoadingSkeleton";
import { RequestSessionDialog } from "@/components/RequestSessionDialog";
import { SearchBar } from "@/components/SearchBar";
import { SkillCard } from "@/components/SkillCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  fetchActiveOfferings,
  fetchProviderStats,
  type OfferingWithProvider,
} from "@/lib/skillswap";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore skills — SkillSwap" },
      {
        name: "description",
        content: "Search and filter peer-taught skills across finance, tech, design, communication and more.",
      },
      { property: "og:title", content: "Explore skills — SkillSwap" },
      {
        property: "og:description",
        content: "Search and filter peer-taught skills across finance, tech, design, communication and more.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { user } = useAuth();
  const userId = user!.id;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("recommended");
  const [requesting, setRequesting] = useState<OfferingWithProvider | null>(null);

  const offerings = useQuery({ queryKey: ["offerings"], queryFn: fetchActiveOfferings });
  const stats = useQuery({ queryKey: ["provider-stats"], queryFn: fetchProviderStats });

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = (offerings.data ?? []).filter((offering) => {
      if (category !== "All" && offering.category !== category) return false;
      if (!term) return true;
      return [
        offering.title,
        offering.description,
        offering.category,
        offering.what_youll_learn ?? "",
        offering.provider?.full_name ?? "",
        offering.provider?.college ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const statMap = stats.data ?? {};
    list = [...list].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const ratingA = statMap[a.provider_id]?.rating ?? 0;
      const ratingB = statMap[b.provider_id]?.rating ?? 0;
      if (sort === "rating") return ratingB - ratingA;
      const sessionsA = statMap[a.provider_id]?.sessions ?? 0;
      const sessionsB = statMap[b.provider_id]?.sessions ?? 0;
      return ratingB * 2 + sessionsB - (ratingA * 2 + sessionsA);
    });

    return list;
  }, [offerings.data, stats.data, search, category, sort]);

  return (
    <main className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        What do you want to learn?
      </h1>
      <p className="mt-2 text-muted-foreground">
        {offerings.data?.length ?? 0} peer-taught skills from students across campuses.
      </p>

      <div className="mt-6 space-y-4">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CategoryFilter value={category} onChange={setCategory} />
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="shrink-0 text-sm text-muted-foreground">
              Sort by
            </label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger id="sort" className="w-44 rounded-xl bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {offerings.isLoading ? (
          <SkillGridSkeleton />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No skills found."
            description="Try another keyword or browse all categories."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((offering) => (
              <SkillCard
                key={offering.id}
                offering={offering}
                stats={stats.data?.[offering.provider_id]}
                isOwn={offering.provider_id === userId}
                onRequest={setRequesting}
              />
            ))}
          </div>
        )}
      </div>

      <RequestSessionDialog
        offering={requesting}
        currentUserId={userId}
        onOpenChange={(open) => !open && setRequesting(null)}
      />
    </main>
  );
}
