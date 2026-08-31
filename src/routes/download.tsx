import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Apple, ArrowLeft, Check, Copy, Download, Laptop, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";




export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download SkillSwap for Mac & Windows" },
      {
        name: "description",
        content:
          "Download the SkillSwap desktop app for macOS or Windows and swap skills with student peers straight from your laptop.",
      },
      { property: "og:title", content: "Download SkillSwap for Mac & Windows" },
      {
        property: "og:description",
        content: "Get the SkillSwap desktop app for macOS or Windows in one click.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DownloadPage,
});

const PLATFORMS = [
  {
    id: "mac" as const,
    file: "SkillSwap-darwin-x64.zip",
    label: "Download for macOS",
    icon: Apple,
    size: "379 MB",
    note: "Unzip and drag SkillSwap.app into Applications. On first launch, right-click the app and choose Open.",
  },
  {
    id: "windows" as const,
    file: "SkillSwap-win32-x64.zip",
    label: "Download for Windows",
    icon: Laptop,
    size: "152 MB",
    note: "Unzip and run SkillSwap.exe. If SmartScreen appears, choose More info → Run anyway.",
  },
];

function DownloadPage() {
  const mutation = useMutation({
    mutationFn: async (file: string) => {
      const { data, error } = await supabase.storage
        .from("downloads")
        .createSignedUrl(file, 60 * 30, { download: true });
      if (error || !data?.signedUrl) throw error ?? new Error("No download link");
      return data.signedUrl;
    },
    onSuccess: (url) => {
      window.location.href = url;

    },
    onError: () => toast.error("Could not start the download. Please try again."),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to site
            </Link>
          </Button>
        </div>
      </header>

      <main className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get SkillSwap on your laptop
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The desktop app gives you the full SkillSwap experience — explore skills, book sessions
            and chat with peers, without opening a browser tab.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const isLoading = mutation.isPending && mutation.variables === platform.file;
            return (
              <div key={platform.id} className="card-surface flex flex-col p-6">
                <platform.icon className="size-6 text-accent" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold">{platform.label}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  ZIP · {platform.size}
                </p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{platform.note}</p>
                <Button
                  className="mt-6 w-full rounded-xl"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(platform.file)}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  {isLoading ? "Preparing…" : "Download"}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Prefer the web? You can keep using SkillSwap right in your browser —{" "}
          <Link to="/explore" className="font-semibold text-accent underline-offset-4 hover:underline">
            explore skills
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
