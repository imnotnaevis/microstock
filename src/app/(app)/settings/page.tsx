"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  ExternalLink,
  AlertTriangle,
  Cpu,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/settings";
import { GEMINI_MODELS } from "@/lib/gemini";

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••••••";
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

type KeyStatus = "idle" | "testing" | "ok" | "limit" | "error";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ geminiKeys: [], geminiModel: "gemini-2.5-flash" });
  const [newKey, setNewKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [keyStatuses, setKeyStatuses] = useState<Record<number, KeyStatus>>({});
  const [isSaved, setIsSaved] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((prev) => {
      const updated = { ...prev, ...next };
      saveSettings(updated);
      return updated;
    });
    setIsSaved(true);
  }

  function handleAddKey() {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (settings.geminiKeys.includes(trimmed)) {
      toast.error("API key ini sudah ada.");
      return;
    }
    updateSettings({ geminiKeys: [...settings.geminiKeys, trimmed] });
    setNewKey("");
    toast.success("API key ditambahkan.");
  }

  function handleDeleteKey(index: number) {
    const next = settings.geminiKeys.filter((_, i) => i !== index);
    updateSettings({ geminiKeys: next });
    setKeyStatuses((prev) => {
      const s = { ...prev };
      delete s[index];
      return s;
    });
    toast.success("API key dihapus.");
  }

  function toggleVisible(index: number) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  async function handleTestKey(index: number) {
    setKeyStatuses((prev) => ({ ...prev, [index]: "testing" }));
    try {
      const res = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settings.geminiKeys[index], model: settings.geminiModel }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setKeyStatuses((prev) => ({ ...prev, [index]: "ok" }));
        toast.success("Key valid dan berfungsi!");
      } else if (data.limit) {
        setKeyStatuses((prev) => ({ ...prev, [index]: "limit" }));
        toast.warning("Quota habis / rate limit.");
      } else {
        setKeyStatuses((prev) => ({ ...prev, [index]: "error" }));
        toast.error(data.error || "Key tidak valid.");
      }
    } catch {
      setKeyStatuses((prev) => ({ ...prev, [index]: "error" }));
      toast.error("Gagal menghubungi server.");
    }
  }

  async function handleTestAll() {
    if (!settings.geminiKeys.length) return;
    await Promise.all(settings.geminiKeys.map((_, i) => handleTestKey(i)));
    toast.success("Cek semua key selesai.");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddKey();
  }

  const statusBadge = (status: KeyStatus) => {
    if (status === "testing") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Cek...</span>;
    if (status === "ok") return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="h-3 w-3" />Aktif</span>;
    if (status === "limit") return <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500"><AlertTriangle className="h-3 w-3" />Limit</span>;
    if (status === "error") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500"><XCircle className="h-3 w-3" />Error</span>;
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  const isTestingAny = Object.values(keyStatuses).some((s) => s === "testing");
  const healthySummary = Object.values(keyStatuses).filter((s) => s === "ok").length;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Settings"
        description="Konfigurasi API key dan preferensi aplikasi"
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Info Card — full width */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">API key disimpan di browser (localStorage)</p>
              <p className="text-xs">Key tidak dikirim ke server pihak ketiga — hanya ke Google Gemini saat kamu generate konten. Aman untuk penggunaan personal.</p>
            </div>
          </CardContent>
        </Card>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* Left — API Keys (wider) */}
          <div className="lg:col-span-3">

        {/* Gemini API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google Gemini API Keys
                </CardTitle>
                <CardDescription className="mt-1">
                  Tambahkan beberapa key untuk rotasi otomatis saat rate limit.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {settings.geminiKeys.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleTestAll}
                    disabled={isTestingAny}
                  >
                    {isTestingAny ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                    Cek Semua
                  </Button>
                )}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Dapatkan key gratis
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new key */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type={showNewKey ? "text" : "password"}
                  placeholder="AIzaSy-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleAddKey} disabled={!newKey.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>

            {/* Key list — always 5 rows, scroll if more */}
            <div className="overflow-y-auto space-y-2 max-h-[268px] pr-4">
              {Array.from({ length: Math.max(5, settings.geminiKeys.length) }, (_, i) => {
                const key = settings.geminiKeys[i];
                const filled = !!key;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-muted/30"
                  >
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">#{i + 1}</span>

                    <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
                      {filled ? (visibleKeys.has(i) ? key : maskKey(key)) : ""}
                    </code>

                    <div className="shrink-0 text-right min-w-[72px]">
                      {filled ? statusBadge(keyStatuses[i] || "idle") : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {filled && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toggleVisible(i)}
                          >
                            {visibleKeys.has(i) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteKey(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="text-xs">
                {settings.geminiKeys.length} key terdaftar
              </Badge>
              {settings.geminiKeys.length > 1 && (
                <span className="text-xs text-muted-foreground">Rotasi otomatis aktif</span>
              )}
              {healthySummary > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {healthySummary} aktif
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

          </div>{/* end left col */}

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Model AI
            </CardTitle>
            <CardDescription>
              Pilih model Gemini yang digunakan untuk semua fitur generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={settings.geminiModel}
              onValueChange={(v) => v && updateSettings({ geminiModel: v as AppSettings["geminiModel"] })}
              items={Object.fromEntries(GEMINI_MODELS.map((m) => [m.value, m.label]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-md p-3">
              <p><span className="font-medium">Gemini 3.8 Flash</span> — Paling seimbang. Cepat, hemat quota, sangat pintar. Rekomendasi utama.</p>
              <p><span className="font-medium">3.5 Flash-Lite</span> — Super cepat dan sangat hemat quota. Paling stabil untuk pemrosesan batch/bulk.</p>
              <p><span className="font-medium">3.1 Pro</span> — Hasil lebih detail & reasoning kuat, tapi lebih lambat dan quota lebih cepat habis.</p>
            </div>
          </CardContent>
        </Card>

        {/* Cara Dapat Key */}
        <Card className="lg:mt-0">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cara Mendapatkan API Key Gratis</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Buka <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aistudio.google.com/apikey</a></li>
              <li>Login dengan akun Google</li>
              <li>Klik <span className="font-medium text-foreground">"Create API key"</span></li>
              <li>Copy key dan paste di kolom di atas</li>
              <li>Untuk key tambahan, buat project Google baru atau pakai akun Google lain</li>
            </ol>
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">
              Free tier Google AI Studio: ~1,500 request/hari per key dengan <span className="font-medium">gemini-3.8-flash</span>.
            </p>
          </CardContent>
        </Card>

          </div>{/* end right col */}
        </div>{/* end grid */}
      </div>
    </div>
  );
}
