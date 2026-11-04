"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Wand2,
  Sparkles,
  Copy,
  Save,
  Loader2,
  RefreshCw,
  Tags,
  Download,
  X,
  CheckCircle2,
  HelpCircle,
  Ratio,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGenerator, type PromptItem } from "@/context/generator-context";
import { QuotaAlert } from "@/components/ui/quota-alert";

const modelsByType: Record<string, { value: string; label: string }[]> = {
  image: [
    { value: "nanobanana", label: "Nano Banana" },
    { value: "midjourney", label: "Midjourney" },
    { value: "firefly", label: "Adobe Firefly" },
    { value: "sdxl", label: "Stable Diffusion XL" },
    { value: "dalle3", label: "DALL·E 3" },
    { value: "ideogram", label: "Ideogram" },
  ],
  video: [
    { value: "veo", label: "Google Veo" },
    { value: "runway", label: "Runway Gen-3" },
    { value: "pika", label: "Pika Labs" },
    { value: "sora", label: "Sora" },
    { value: "kling", label: "Kling AI" },
  ],
  vector: [
    { value: "nanobanana", label: "Nano Banana" },
    { value: "firefly", label: "Adobe Firefly (Vector)" },
    { value: "midjourney", label: "Midjourney + Vectorize" },
    { value: "sdxl", label: "SDXL + SVG" },
  ],
  photo: [
    { value: "nanobanana", label: "Nano Banana" },
    { value: "firefly", label: "Adobe Firefly" },
    { value: "midjourney", label: "Midjourney" },
    { value: "dalle3", label: "DALL·E 3" },
  ],
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  image: "Image / Ilustrasi",
  photo: "Foto",
  vector: "Vector",
  video: "Video",
};

export const MARKET_ASPECT_RATIO_INFO: Record<
  string,
  { label: string; useCase: string; demand: string; badge: string }
> = {
  "16:9": {
    label: "16:9 Landscape (Widescreen)",
    useCase: "Website Hero Banner, YouTube Thumbnails, Header Web, Digital Ads, Presentasi Bisnis",
    demand: "Sangat Tinggi",
    badge: "Paling Dicari untuk Web & Banner",
  },
  "9:16": {
    label: "9:16 Vertical (Mobile Fullscreen)",
    useCase: "TikTok, Instagram Reels, YouTube Shorts, Story, Wallpaper Handphone, Splash Screen",
    demand: "Sangat Tinggi",
    badge: "Demand Tinggi untuk Mobile & Video",
  },
  "3:2": {
    label: "3:2 Standar 35mm (Landscape)",
    useCase: "Standar fotografi komersial Shutterstock & Adobe Stock, editorial, majalah, kemasan",
    demand: "Tinggi",
    badge: "Standar Emas Stock Photography",
  },
  "2:3": {
    label: "2:3 Vertical (Portrait)",
    useCase: "Poster, cover buku/e-book, flyer vertikal, katalog mode & fashion",
    demand: "Tinggi",
    badge: "Populer untuk Poster & Cetak",
  },
  "1:1": {
    label: "1:1 Square (Persegi)",
    useCase: "Icon Set, Instagram Feed, Marketplace Thumbnail (Tokopedia/Shopee/Amazon), Profil",
    demand: "Tinggi",
    badge: "Standar untuk Icon & E-Commerce",
  },
  "4:3": {
    label: "4:3 Standard Display",
    useCase: "Katalog produk, tampilan tablet/iPad, foto editorial cetak",
    demand: "Menengah",
    badge: "Standar Display & E-Commerce",
  },
  "3:4": {
    label: "3:4 Vertical Medium",
    useCase: "Pinterest pin, infografis feed, editorial portrait",
    demand: "Menengah",
    badge: "Populer untuk Pinterest & Feed",
  },
};

const RATIOS_BY_ASSET_TYPE: Record<string, string[]> = {
  image: ["16:9", "4:3", "1:1", "3:2", "9:16"],
  photo: ["3:2", "4:3", "16:9", "1:1", "2:3"],
  vector: ["1:1", "16:9", "4:3", "3:4"],
  video: ["16:9", "9:16", "1:1"],
};

function PromptGeneratorContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const initialStyle = searchParams.get("style") || "";
  const initialThemes = searchParams.get("themes") || "";
  const initialType = searchParams.get("type") || "image";
  const initialReason = searchParams.get("reason") || "";
  const initialPlatform = searchParams.get("platform") || "";

  const {
    promptForm,
    updatePromptForm,
    prompts,
    setPrompts,
    isPromptGenerating,
    promptError,
    isPromptQuotaError,
    clearPromptError,
    startPromptGeneration,
    savedPrompts,
    savePromptId,
  } = useGenerator();

  const [showRatioGuide, setShowRatioGuide] = useState(false);
  const [lastContext, setLastContext] = useState<{
    style: string;
    themes: string;
    assetType: string;
    previewSrc: string | null;
    source: string;
  } | null>(null);

  const {
    keyword,
    temaUtama,
    targetModel,
    assetType,
    themes,
    style,
    brief,
    batchCount,
    selectedRatio,
    seamless,
    abstrak,
    iconSet,
    contextPreview,
  } = promptForm;

  const setAssetType = (v: string) => updatePromptForm({ assetType: v });
  const setTargetModel = (v: string) => updatePromptForm({ targetModel: v });
  const setSelectedRatio = (v: string) => updatePromptForm({ selectedRatio: v });
  const setKeyword = (v: string) => updatePromptForm({ keyword: v });
  const setThemes = (v: string) => updatePromptForm({ themes: v });
  const setStyle = (v: string) => updatePromptForm({ style: v });
  const setBrief = (v: string) => updatePromptForm({ brief: v });
  const setBatchCount = (v: string) => updatePromptForm({ batchCount: v });
  const setTemaUtama = (v: string) => updatePromptForm({ temaUtama: v });
  const setSeamless = (v: boolean) => updatePromptForm({ seamless: v });
  const setAbstrak = (v: boolean) => updatePromptForm({ abstrak: v });
  const setIconSet = (v: boolean) => updatePromptForm({ iconSet: v });
  const setContextPreview = (v: string | null) => updatePromptForm({ contextPreview: v });

  const videoModeOn = assetType === "video" && (seamless || abstrak);
  const temaUtamaOn = !!temaUtama.trim();
  const isGenerating = isPromptGenerating;

  // Otomatis sinkronkan parameter tren saat navigasi dari dashboard
  useEffect(() => {
    if (initialKeyword) {
      updatePromptForm({
        temaUtama: initialKeyword,
        keyword: initialKeyword,
        assetType: initialType && ["image", "photo", "vector", "video"].includes(initialType) ? initialType : assetType,
        brief: initialReason ? `Tren Microstock (${initialPlatform ? initialPlatform + " - " : ""}${initialReason})` : brief,
        themes: initialThemes || themes,
        style: initialStyle || style,
      });
    }
  }, [initialKeyword, initialReason, initialPlatform, initialType, initialThemes, initialStyle]);

  useEffect(() => {
    const stored = sessionStorage.getItem("promptContext");
    if (stored) {
      try {
        const ctx = JSON.parse(stored);
        updatePromptForm({
          style: ctx.style || style,
          themes: ctx.themes || themes,
          assetType: ctx.assetType || assetType,
          contextPreview: ctx.previewSrc || contextPreview,
        });
      } catch {}
      sessionStorage.removeItem("promptContext");
    } else {
      const last = localStorage.getItem("lastAnalysisContext");
      if (last) {
        try {
          setLastContext(JSON.parse(last));
        } catch {}
      }
    }
  }, []);

  function handleUseLastContext() {
    if (!lastContext) return;
    updatePromptForm({
      style: lastContext.style || style,
      themes: lastContext.themes || themes,
      assetType: lastContext.assetType || assetType,
      contextPreview: lastContext.previewSrc || contextPreview,
    });
    setLastContext(null);
    toast.success("Hasil analisis diterapkan!");
  }

  async function handleGenerate() {
    await startPromptGeneration();
  }

  function handleCopy(text: string, label = "Prompt disalin!") {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  function handleSave(id: string) {
    savePromptId(id);
    toast.success("Prompt disimpan ke library!");
  }

  function handleExport() {
    const content = prompts
      .map(
        (p, i) =>
          `# Prompt ${i + 1}\n${p.text}\n\nNegative: ${p.negative}\nAspect Ratio: ${p.aspectRatio}${
            p.aspectRatioReason ? `\nKebutuhan Pasar: ${p.aspectRatioReason}` : ""
          }`
      )
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts.txt";
    a.click();
    toast.success("Prompt diekspor!");
  }

  const currentModels = modelsByType[assetType] || modelsByType.image;
  const selectedModelLabel = currentModels.find((m) => m.value === targetModel)?.label;
  const currentRatios = RATIOS_BY_ASSET_TYPE[assetType] || RATIOS_BY_ASSET_TYPE.image;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Prompt Generator"
        description="Generate prompt siap pakai untuk image, foto, vector, dan video"
        actions={
          prompts.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Config Panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Konfigurasi</CardTitle>
                {initialKeyword && (
                  <Badge variant="secondary" className="text-[11px] font-normal">
                    Tren Terhubung
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {/* Tren Terhubung Banner */}
              {initialKeyword && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Tren Otomatis dari Dashboard</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {initialPlatform || "Microstock"}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Keyword: <span className="font-semibold text-foreground">{initialKeyword}</span>
                    {initialReason && (
                      <span className="block mt-0.5 text-[11px] text-muted-foreground/90">
                        {initialReason}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-primary/90 font-medium pt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Konfigurasi tren telah terisi. Silakan pilih <strong>Target Model AI</strong> di bawah.</span>
                  </div>
                </div>
              )}

              {/* Preview dari Copy Style */}
              {contextPreview && (
                <div className="relative">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Referensi dari Copy Style
                  </div>
                  <div className="relative rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={contextPreview}
                      alt="Referensi"
                      className="w-full h-40 object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                      onClick={() => setContextPreview(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Separator className="mt-4" />
                </div>
              )}

              {lastContext && (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
                  <span className="text-blue-700">
                    Hasil analisis <span className="font-medium">{lastContext.source}</span> tersedia
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-blue-700 hover:text-blue-800 px-2"
                      onClick={handleUseLastContext}
                    >
                      Gunakan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600"
                      onClick={() => setLastContext(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipe Aset</Label>
                  <Select
                    value={assetType}
                    onValueChange={(v) => {
                      if (v) {
                        setAssetType(v);
                        const newModels = modelsByType[v] || modelsByType.image;
                        if (targetModel && !newModels.some((m) => m.value === targetModel)) {
                          setTargetModel("");
                        }
                        const newRatios = RATIOS_BY_ASSET_TYPE[v] || RATIOS_BY_ASSET_TYPE.image;
                        if (selectedRatio !== "auto" && !newRatios.includes(selectedRatio)) {
                          setSelectedRatio("auto");
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue>{ASSET_TYPE_LABELS[assetType] ?? assetType}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image / Ilustrasi</SelectItem>
                      <SelectItem value="photo">Foto</SelectItem>
                      <SelectItem value="vector">Vector</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Kategori Aset</Label>
                  {videoModeOn || temaUtamaOn ? (
                    <div
                      className="flex h-8 w-full items-center rounded-md border border-input bg-muted px-3 text-xs text-muted-foreground truncate"
                      title={temaUtama || keyword}
                    >
                      {temaUtama || "—"}
                    </div>
                  ) : (
                    <Select value={keyword} onValueChange={(v) => v && setKeyword(v)}>
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue>{keyword}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Animal",
                          "Business",
                          "Food and Drinks",
                          "Graphic Resources",
                          "Landscapes",
                          "People",
                          "Plant and Flowers",
                          "Technology",
                          "Sports",
                          "Travel",
                          "Transport",
                        ].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Target Model AI</span>
                    {!targetModel && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                        *Wajib pilih
                      </span>
                    )}
                  </Label>
                  <Select value={targetModel} onValueChange={(v) => v && setTargetModel(v)}>
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs w-full transition-colors",
                        !targetModel &&
                          "border-amber-500/70 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-medium"
                      )}
                    >
                      <SelectValue placeholder="-- Pilih Model AI --">
                        {targetModel ? selectedModelLabel ?? targetModel : "-- Pilih Model AI --"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Aspek Rasio & Rekomendasi Pasar */}
              <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-semibold">Rekomendasi Aspek Rasio</Label>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-300 text-blue-700 bg-blue-50/50">
                      Kebutuhan Pasar
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRatioGuide(!showRatioGuide)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <HelpCircle className="h-3 w-3" />
                    {showRatioGuide ? "Tutup Panduan" : "Panduan Pasar"}
                  </button>
                </div>

                <Select value={selectedRatio} onValueChange={(v) => v && setSelectedRatio(v)}>
                  <SelectTrigger className="h-8 text-xs w-full bg-background">
                    <SelectValue>
                      {selectedRatio === "auto"
                        ? "Auto (Rekomendasi AI Sesuai Kebutuhan Pasar)"
                        : `${selectedRatio} — ${MARKET_ASPECT_RATIO_INFO[selectedRatio]?.badge || selectedRatio}`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto (Rekomendasi AI Paling Laku di Pasar)
                    </SelectItem>
                    {currentRatios.map((r) => {
                      const info = MARKET_ASPECT_RATIO_INFO[r];
                      return (
                        <SelectItem key={r} value={r}>
                          {r} {info ? `— ${info.badge}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Quick Chips Rasio Terpopuler Pasar */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-0.5">Rasio:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRatio("auto")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors",
                      selectedRatio === "auto"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    Auto
                  </button>
                  {currentRatios.slice(0, 4).map((r) => {
                    const isSelected = selectedRatio === r;
                    const info = MARKET_ASPECT_RATIO_INFO[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRatio(r)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        )}
                        title={info?.useCase}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                {/* Panduan Kebutuhan Pasar Accordion/Card */}
                {showRatioGuide && (
                  <div className="rounded-md border border-border bg-background p-2.5 space-y-2 text-xs mt-2">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>Kebutuhan Pasar Microstock ({ASSET_TYPE_LABELS[assetType]}):</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Klik untuk pilih</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                      {currentRatios.map((r) => {
                        const info = MARKET_ASPECT_RATIO_INFO[r];
                        if (!info) return null;
                        const isSelected = selectedRatio === r;
                        return (
                          <div
                            key={r}
                            onClick={() => setSelectedRatio(r)}
                            className={cn(
                              "p-2 rounded-md border transition-all cursor-pointer flex items-start gap-2",
                              isSelected
                                ? "bg-primary/10 border-primary text-foreground"
                                : "bg-muted/30 hover:bg-muted/70 border-border/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-muted text-foreground shrink-0 text-[10px]">
                              {r}
                            </span>
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                                <span>{info.label}</span>
                                <Badge variant="secondary" className="text-[9px] py-0 h-3.5">
                                  {info.badge}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground leading-tight">
                                {info.useCase}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground/90 italic pt-1 border-t">
                      💡 <strong>Tips Penjualan:</strong> Pembeli microstock mencari rasio sesuai tujuan desain (Hero Banner web butuh 16:9, konten medsos butuh 9:16 atau 1:1, sedangkan kebutuhan cetak & editorial butuh 3:2).
                    </div>
                  </div>
                )}
              </div>

              {assetType === "video" && (
                <div className="space-y-1.5">
                  <Label>Mode Khusus Video</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSeamless(!seamless)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                        seamless
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      Seamless Loop
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbstrak(!abstrak)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                        abstrak
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      Abstrak
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Tema Utama</Label>
                <Input
                  placeholder="mis: Coffee Shop, Space Exploration, Cherry Blossom..."
                  value={temaUtama}
                  onChange={(e) => setTemaUtama(e.target.value)}
                />
                {temaUtamaOn && (
                  <p className="text-xs text-muted-foreground">
                    Kategori Aset dinonaktifkan — tema utama dipakai sebagai kategori.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Tema Tambahan</Label>
                <Input
                  placeholder="mis: tropical, golden hour, minimalist"
                  value={themes}
                  onChange={(e) => setThemes(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Style Preset</Label>
                <Input
                  placeholder="mis: soft natural light, bokeh, warm tones"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
                {initialStyle && (
                  <p className="text-xs text-muted-foreground">Dari Copy Style</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Brief Tambahan (opsional)</Label>
                <Textarea
                  placeholder="Deskripsi tambahan, target platform, mood, dll..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Jumlah Variasi (Batch)</Label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={iconSet}
                      onChange={(e) => setIconSet(e.target.checked)}
                      className="h-3.5 w-3.5 accent-primary cursor-pointer"
                    />
                    Icon Set
                  </label>
                </div>
                <Select
                  value={batchCount}
                  onValueChange={(v) => v && setBatchCount(v)}
                  items={{
                    "1": "1 variasi",
                    "3": "3 variasi",
                    "5": "5 variasi",
                    "10": "10 variasi",
                    "20": "20 variasi",
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "3", "5", "10", "20"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n} variasi
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button - STRICTLY DISABLED WHEN !targetModel */}
              <div className="space-y-2 pt-2">
                <Button
                  className={cn(
                    "w-full transition-all duration-200",
                    !targetModel
                      ? "opacity-60 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted border border-dashed border-amber-500/50"
                      : "shadow-sm font-semibold"
                  )}
                  onClick={handleGenerate}
                  disabled={isGenerating || !targetModel}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Prompt...
                    </>
                  ) : !targetModel ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 opacity-50 text-amber-600 dark:text-amber-400" />
                      Pilih Target Model AI Dahulu
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {batchCount} Prompt ({selectedModelLabel || targetModel})
                    </>
                  )}
                </Button>
                {!targetModel && (
                  <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 font-medium">
                    Pilih Target Model AI (mis: Nano Banana) pada dropdown di atas untuk mengaktifkan tombol generate.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {isPromptQuotaError && (
              <QuotaAlert
                message={promptError || undefined}
                onRetry={handleGenerate}
                onDismiss={clearPromptError}
              />
            )}

            {promptError && !isPromptQuotaError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-xs text-red-800 dark:text-red-300 flex items-start justify-between gap-2 shadow-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Gagal Generate Prompt:</span> {promptError}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800 cursor-pointer"
                  onClick={clearPromptError}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {prompts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {prompts.length} Prompt Generated ({selectedModelLabel || targetModel})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !targetModel}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="space-y-4">
                  {prompts.map((prompt, i) => {
                    const ratioInfo = MARKET_ASPECT_RATIO_INFO[prompt.aspectRatio];
                    return (
                      <Card
                        key={prompt.id}
                        className={
                          savedPrompts.includes(prompt.id) ? "border-primary/50 bg-primary/5" : ""
                        }
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Prompt #{i + 1}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-xs font-semibold bg-primary/5 border-primary/30 text-primary">
                                {prompt.aspectRatio}
                              </Badge>
                              <Badge variant="secondary" className="text-xs font-medium">
                                {targetModel === "nanobanana" ? "Nano Banana" : selectedModelLabel || targetModel}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Rekomendasi Aspek Rasio Pasar Callout */}
                          <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 p-2.5 text-xs">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-[11px] shadow-xs">
                              <Ratio className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap justify-between">
                                <span className="font-semibold text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
                                  <span>Rasio Pasar: {prompt.aspectRatio}</span>
                                  <span className="font-normal text-muted-foreground">•</span>
                                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                                    {ratioInfo?.badge || "Rekomendasi Komersial"}
                                  </span>
                                </span>
                                {ratioInfo?.demand && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                                    Demand: {ratioInfo.demand}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-blue-900/85 dark:text-blue-200/90 leading-relaxed">
                                {prompt.aspectRatioReason || ratioInfo?.useCase || "Ideal untuk aset komersial microstock"}
                              </p>
                              {targetModel === "nanobanana" && (
                                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium pt-0.5 border-t border-blue-200/50 dark:border-blue-900/40 mt-1">
                                  <strong>Tips Nano Banana:</strong> Set aspect ratio ke <strong>{prompt.aspectRatio}</strong> pada model Nano Banana Anda sebelum generate gambar.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Prompt Text */}
                          <div className="bg-muted rounded-md p-3 text-sm leading-relaxed font-mono select-all">
                            {prompt.text}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">Negative Prompt</Label>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(prompt.negative, "Negative prompt disalin!")
                                }
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Copy className="h-3 w-3" /> Salin Negatif
                              </button>
                            </div>
                            <div className="bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 rounded-md p-2 text-xs font-mono text-red-700 dark:text-red-400 leading-relaxed select-all">
                              {prompt.negative}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs flex-1 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                              onClick={() =>
                                handleCopy(
                                  prompt.text,
                                  `Prompt disalin! Gunakan rasio ${prompt.aspectRatio} di ${
                                    targetModel === "nanobanana" ? "Nano Banana" : selectedModelLabel || targetModel
                                  }.`
                                )
                              }
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Salin Prompt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs px-2.5 cursor-pointer"
                              title="Salin Prompt + Negative"
                              onClick={() =>
                                handleCopy(
                                  `${prompt.text}\n\nNegative: ${prompt.negative}`,
                                  "Prompt + Negative disalin!"
                                )
                              }
                            >
                              + Negatif
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs cursor-pointer"
                              onClick={() => handleSave(prompt.id)}
                              disabled={savedPrompts.includes(prompt.id)}
                            >
                              <Save className="h-3.5 w-3.5 mr-1" />
                              {savedPrompts.includes(prompt.id) ? "Tersimpan" : "Simpan"}
                            </Button>
                            <Link
                              href={`/seo?keyword=${encodeURIComponent(temaUtama.trim() || keyword)}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs")}
                            >
                              <Tags className="h-3.5 w-3.5 mr-1" />
                              SEO
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-64">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">
                    {initialKeyword
                      ? `Tren "${initialKeyword}" siap di-generate`
                      : "Isi konfigurasi di sebelah kiri"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!targetModel
                      ? "Pilih Target Model AI (mis: Nano Banana) lalu klik Generate."
                      : `Klik tombol "Generate Prompt (${selectedModelLabel})" untuk memulai.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromptPage() {
  return (
    <Suspense>
      <PromptGeneratorContent />
    </Suspense>
  );
}
