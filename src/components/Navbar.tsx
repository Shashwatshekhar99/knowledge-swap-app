import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, Compass, Download, LayoutDashboard, LogOut, Menu, Plus, Sparkles, User } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { firstNameOf } from "@/lib/skillswap";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/my-skills", label: "My Skills", icon: Sparkles },
  { to: "/requests", label: "Requests", icon: Bell },
] as const;

export function Navbar() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-incoming", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("session_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  const activeProps = { className: "bg-secondary text-foreground" };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo to="/dashboard" />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeProps={activeProps}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
              <Link to="/create-skill">
                <Plus className="size-4" aria-hidden="true" /> Share a Skill
              </Link>
            </Button>

            <Link
              to="/requests"
              className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={`Requests${pendingCount ? `, ${pendingCount} pending` : ""}`}
            >
              <Bell className="size-5" aria-hidden="true" />
              {pendingCount > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              ) : null}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-secondary"
                  aria-label="Account menu"
                >
                  <UserAvatar
                    name={profile?.full_name}
                    url={profile?.avatar_url}
                    className="size-8"
                  />
                  <span className="hidden text-sm font-semibold lg:inline">
                    {firstNameOf(profile?.full_name)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel className="truncate">
                  {profile?.full_name ?? "Your account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="size-4" aria-hidden="true" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/create-skill">
                    <Plus className="size-4" aria-hidden="true" /> Share a Skill
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/download">
                    <Download className="size-4" aria-hidden="true" /> Download app
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="size-4" aria-hidden="true" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SheetTitle className="mb-6">
                  <Logo to="/dashboard" />
                </SheetTitle>
                <nav className="flex flex-col gap-1" aria-label="Mobile">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      activeProps={activeProps}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    activeProps={activeProps}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <User className="size-4" aria-hidden="true" /> Profile
                  </Link>
                </nav>
                <Button asChild className="mt-6 w-full rounded-xl">
                  <Link to="/create-skill" onClick={() => setOpen(false)}>
                    <Plus className="size-4" aria-hidden="true" /> Share a Skill
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 w-full rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                >
                  <LogOut className="size-4" aria-hidden="true" /> Logout
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        aria-label="Bottom"
      >
        <div className="flex items-stretch justify-around">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-accent" }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
