"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Sparkles, Tags, ArrowRight } from "lucide-react";
import { useGenerator } from "@/context/generator-context";

export function GenerationStatusBanner() {
  const pathname = usePathname();
  const { isPromptGenerating, isSeoGenerating, isBulkGenerating } = useGenerator();

  const showPrompt = isPromptGenerating && pathname !== "/prompt";
  const showSeo = (isSeoGenerating || isBulkGenerating) && pathname !== "/seo";

  if (!showPrompt && !showSeo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-3 duration-200">
      {showPrompt && (
        <div className="flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg text-xs font-medium border border-primary/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>Sedang men-generate prompt di background...</span>
          <Link
            href="/prompt"
            className="flex items-center gap-1 font-semibold underline underline-offset-2 ml-1 hover:opacity-90"
          >
            <span>Buka</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {showSeo && (
        <div className="flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg text-xs font-medium border border-primary/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>Sedang men-generate SEO di background...</span>
          <Link
            href="/seo"
            className="flex items-center gap-1 font-semibold underline underline-offset-2 ml-1 hover:opacity-90"
          >
            <span>Buka</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
