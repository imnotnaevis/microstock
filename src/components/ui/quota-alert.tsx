"use client";

import Link from "next/link";
import { AlertTriangle, Settings, RefreshCw, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuotaAlertProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function QuotaAlert({ message, onRetry, onDismiss }: QuotaAlertProps) {
  return (
    <div className="relative rounded-lg border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-800 p-4 text-xs text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 cursor-pointer"
          title="Tutup pesan"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white font-bold shadow-xs">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-1.5 flex-1 pr-6">
          <div className="font-semibold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2">
            <span>Batas Kuota Gemini Tercapai (Rate Limit 429)</span>
          </div>
          <p className="text-amber-900/90 dark:text-amber-300 leading-relaxed">
            {message ||
              "API Key Gemini gratis memiliki limit permintaan per menit (RPM). Request tidak dapat diproses sementara karena kuota sesaat telah habis."}
          </p>

          <div className="pt-1 text-[11px] space-y-1 text-amber-900/80 dark:text-amber-300/90 bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-md border border-amber-200 dark:border-amber-800/60">
            <p className="font-semibold text-amber-950 dark:text-amber-100">Solusi Cepat:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <strong>Tunggu 1–2 menit:</strong> Batas rate limit Gemini per menit akan otomatis reset kembali normal.
              </li>
              <li>
                <strong>Tambah API Key cadangan di Settings:</strong> Anda bisa memasukkan 2–3 API key (bebas biaya) agar sistem otomatis berganti key saat key utama terkena limit.
              </li>
              <li>
                <strong>Gunakan model hemat kuota:</strong> Pilih <em>Gemini 2.0 Flash-Lite</em> atau <em>Gemini 2.5 Flash</em> di menu Settings.
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-7 text-xs bg-background border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50 shadow-xs cursor-pointer font-medium inline-flex items-center"
              )}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Atur / Tambah API Key di Settings
            </Link>
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer font-medium"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Coba Lagi Sekarang
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
