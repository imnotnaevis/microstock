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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";
import { savePromptSession } from "@/lib/history";

type PromptItem = { id: string; text: string; negative: string; aspectRatio: string };

const modelsByType: Record<string, { value: string; label: string }[]> = {
  image: [
    { value: "nanobanana", label: "🍌 Nano Banana" },
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
    { value: "nanobanana", label: "🍌 Nano Banana" },
    { value: "firefly", label: "Adobe Firefly (Vector)" },
    { value: "midjourney", label: "Midjourney + Vectorize" },
    { value: "sdxl", label: "SDXL + SVG" },
  ],
  photo: [
    { value: "nanobanana", label: "🍌 Nano Banana" },
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

function PromptGeneratorContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const initialStyle = searchParams.get("style") || "";
  const initialThemes = searchParams.get("themes") || "";
  const initialType = searchParams.get("type") || "image";
  const initialReason = searchParams.get("reason") || "";
  const initialPlatform = searchParams.get("platform") || "";

  const [assetType, setAssetType] = useState(
    ["image", "photo", "vector", "video"].includes(initialType) ? initialType : "image"
  );
  // Target model wajib dipilih manual oleh pengguna, default kosong
  const [targetModel, setTargetModel] = useState("");
  const [keyword, setKeyword] = useState(initialKeyword || "Animal");
  const [themes, setThemes] = useState(initialThemes);
  const [style, setStyle] = useState(initialStyle);
  const [brief, setBrief] = useState(
    initialReason
      ? `Tren Microstock (${initialPlatform ? initialPlatform + " - " : ""}${initialReason})`
      : ""
  );
  const [batchCount, setBatchCount] = useState("3");
  const [temaUtama, setTemaUtama] = useState(initialKeyword);
  const [seamless, setSeamless] = useState(false);
  const [abstrak, setAbstrak] = useState(false);
  const [iconSet, setIconSet] = useState(false);
  const [lastContext, setLastContext] = useState<{
    style: string;
    themes: string;
    assetType: string;
    previewSrc: string | null;
    source: string;
  } | null>(null);

  const videoModeOn = assetType === "video" && (seamless || abstrak);
  const temaUtamaOn = !!temaUtama.trim();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [contextPreview, setContextPreview] = useState<string | null>(null);

  // Otomatis sinkronkan parameter tren saat navigasi dari dashboard
  useEffect(() => {
    if (initialKeyword) {
      setTemaUtama(initialKeyword);
      setKeyword(initialKeyword);
    }
    if (initialType && ["image", "photo", "vector", "video"].includes(initialType)) {
      setAssetType(initialType);
    }
    if (initialReason) {
      setBrief(`Tren Microstock (${initialPlatform ? initialPlatform + " - " : ""}${initialReason})`);
    }
    if (initialThemes) {
      setThemes(initialThemes);
    }
    if (initialStyle) {
      setStyle(initialStyle);
    }
  }, [initialKeyword, initialReason, initialPlatform, initialType, initialThemes, initialStyle]);

  useEffect(() => {
    const stored = sessionStorage.getItem("promptContext");
    if (stored) {
      try {
        const ctx = JSON.parse(stored);
        if (ctx.style) setStyle(ctx.style);
        if (ctx.themes) setThemes(ctx.themes);
        if (ctx.assetType) setAssetType(ctx.assetType);
        if (ctx.previewSrc) setContextPreview(ctx.previewSrc);
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
    if (lastContext.style) setStyle(lastContext.style);
    if (lastContext.themes) setThemes(lastContext.themes);
    if (lastContext.assetType) setAssetType(lastContext.assetType);
    if (lastContext.previewSrc) setContextPreview(lastContext.previewSrc);
    setLastContext(null);
    toast.success("Hasil analisis diterapkan!");
  }

  async function handleGenerate() {
    if (!targetModel) {
      toast.error("Silakan pilih Target Model AI terlebih dahulu!");
      return;
    }

    const { geminiKeys, geminiModel } = loadSettings();

    setIsGenerating(true);
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: temaUtama.trim() || keyword,
          themes,
          style,
          brief,
          assetType,
          targetModel,
          count: batchCount,
          model: geminiModel,
          keys: geminiKeys || [],
          seamless,
          abstrak,
          iconSet,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate gagal");
      setPrompts(data);
      const historyKeyword =
        temaUtama.trim() ||
        (videoModeOn ? [seamless && "Seamless", abstrak && "Abstrak"].filter(Boolean).join(" + ") : keyword);
      savePromptSession({
        keyword: historyKeyword,
        assetType,
        targetModel,
        themes,
        style,
        prompts: data.map((p: PromptItem) => ({
          text: p.text,
          negative: p.negative,
          aspectRatio: p.aspectRatio,
        })),
      });
      toast.success(`${data.length} prompt berhasil di-generate!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy(text: string, label = "Prompt disalin!") {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  function handleSave(id: string) {
    setSavedPrompts((prev) => [...prev, id]);
    toast.success("Prompt disimpan ke library!");
  }

  function handleExport() {
    const content = prompts
      .map(
        (p, i) =>
          `# Prompt ${i + 1}\n${p.text}\n\nNegative: ${p.negative}\nAspect Ratio: ${p.aspectRatio}`
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

              {/* Quick Select Model Pills */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Pilih Cepat Model AI:</span>
                  {!targetModel && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Pilih model untuk mengaktifkan prompt
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentModels.map((m) => {
                    const isSelected = targetModel === m.value;
                    const isNano = m.value === "nanobanana";
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setTargetModel(m.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary/40"
                            : isNano
                            ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-semibold"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

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
                      🔁 Seamless
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
                      ✨ Abstrak
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
                    ⚠️ Tombol generate dinonaktifkan sampai Anda memilih Target Model AI (mis: 🍌 Nano Banana)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
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
                  {prompts.map((prompt, i) => (
                    <Card
                      key={prompt.id}
                      className={
                        savedPrompts.includes(prompt.id) ? "border-primary/50 bg-primary/5" : ""
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Prompt #{i + 1}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {prompt.aspectRatio}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {targetModel === "nanobanana" ? "🍌 Nano Banana" : selectedModelLabel || targetModel}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
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
                                `Prompt disalin! Siap dipaste ke ${
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
                  ))}
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
                      ? "Pilih Target Model AI (mis: 🍌 Nano Banana) lalu klik Generate."
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
