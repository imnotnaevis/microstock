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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { loadSettings } from "@/lib/settings";
import { savePromptSession } from "@/lib/history";

type PromptItem = { id: string; text: string; negative: string; aspectRatio: string };

const modelsByType: Record<string, { value: string; label: string }[]> = {
  image: [
    { value: "midjourney", label: "Midjourney" },
    { value: "firefly", label: "Adobe Firefly" },
    { value: "sdxl", label: "Stable Diffusion XL" },
    { value: "dalle3", label: "DALL·E 3" },
    { value: "ideogram", label: "Ideogram" },
    { value: "nanobanana", label: "Nano Banana" },
  ],
  video: [
    { value: "veo", label: "Google Veo" },
    { value: "runway", label: "Runway Gen-3" },
    { value: "pika", label: "Pika Labs" },
    { value: "sora", label: "Sora" },
    { value: "kling", label: "Kling AI" },
  ],
  vector: [
    { value: "firefly", label: "Adobe Firefly (Vector)" },
    { value: "midjourney", label: "Midjourney + Vectorize" },
    { value: "sdxl", label: "SDXL + SVG" },
    { value: "nanobanana", label: "Nano Banana" },
  ],
  photo: [
    { value: "firefly", label: "Adobe Firefly" },
    { value: "midjourney", label: "Midjourney" },
    { value: "dalle3", label: "DALL·E 3" },
    { value: "nanobanana", label: "Nano Banana" },
  ],
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  image: "Image / Ilustrasi", photo: "Foto", vector: "Vector", video: "Video",
};

function PromptGeneratorContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const initialStyle = searchParams.get("style") || "";
  const initialThemes = searchParams.get("themes") || "";
  const initialType = searchParams.get("type") || "image";

  const [assetType, setAssetType] = useState(initialType);
  const [targetModel, setTargetModel] = useState("midjourney");
  const [keyword, setKeyword] = useState("Animal");
  const [themes, setThemes] = useState(initialThemes);
  const [style, setStyle] = useState(initialStyle);
  const [brief, setBrief] = useState("");
  const [batchCount, setBatchCount] = useState("3");
  const [temaUtama, setTemaUtama] = useState("");
  const [seamless, setSeamless] = useState(false);
  const [abstrak, setAbstrak] = useState(false);
  const [iconSet, setIconSet] = useState(false);
  const [lastContext, setLastContext] = useState<{ style: string; themes: string; assetType: string; previewSrc: string | null; source: string } | null>(null);
  const videoModeOn = assetType === "video" && (seamless || abstrak);
  const temaUtamaOn = !!temaUtama.trim();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [contextPreview, setContextPreview] = useState<string | null>(null);

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
        try { setLastContext(JSON.parse(last)); } catch {}
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
    const { geminiKeys, geminiModel } = loadSettings();
    if (!geminiKeys.length) {
      toast.error("Tambahkan API key Gemini di halaman Settings terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: temaUtama.trim() || keyword, themes, style, brief, assetType, targetModel, count: batchCount, model: geminiModel, keys: geminiKeys, seamless, abstrak, iconSet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate gagal");
      setPrompts(data);
      const historyKeyword = temaUtama.trim() || (videoModeOn ? [seamless && "Seamless", abstrak && "Abstrak"].filter(Boolean).join(" + ") : keyword);
      savePromptSession({ keyword: historyKeyword, assetType, targetModel, themes, style, prompts: data.map((p: PromptItem) => ({ text: p.text, negative: p.negative, aspectRatio: p.aspectRatio })) });
      toast.success(`${data.length} prompt berhasil di-generate!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Prompt disalin!");
  }

  function handleSave(id: string) {
    setSavedPrompts((prev) => [...prev, id]);
    toast.success("Prompt disimpan ke library!");
  }

  function handleExport() {
    const content = prompts.map((p, i) =>
      `# Prompt ${i + 1}\n${p.text}\n\nNegative: ${p.negative}\nAspect Ratio: ${p.aspectRatio}`
    ).join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts.txt";
    a.click();
    toast.success("Prompt diekspor!");
  }

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
            <CardHeader>
              <CardTitle className="text-base">Konfigurasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  <span className="text-blue-700">Hasil analisis <span className="font-medium">{lastContext.source}</span> tersedia</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-700 hover:text-blue-800 px-2" onClick={handleUseLastContext}>
                      Gunakan
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600" onClick={() => setLastContext(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipe Aset</Label>
                  <Select value={assetType} onValueChange={(v) => v && setAssetType(v)}>
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
                    <div className="flex h-8 w-full items-center rounded-md border border-input bg-muted px-3 text-xs text-muted-foreground">—</div>
                  ) : (
                    <Select value={keyword} onValueChange={(v) => v && setKeyword(v)}>
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue>{keyword}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {["Animal","Business","Food and Drinks","Graphic Resources","Landscapes","People","Plant and Flowers","Technology","Sports","Travel","Transport"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Target Model AI</Label>
                  <Select value={targetModel} onValueChange={(v) => v && setTargetModel(v)}>
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue>{(modelsByType[assetType] || modelsByType.image).find(m => m.value === targetModel)?.label ?? targetModel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(modelsByType[assetType] || modelsByType.image).map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        seamless ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      🔁 Seamless
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbstrak(!abstrak)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        abstrak ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-muted"
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
                  <p className="text-xs text-muted-foreground">Kategori Aset dinonaktifkan — tema utama dipakai sebagai kategori.</p>
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
                  items={{ "1": "1 variasi", "3": "3 variasi", "5": "5 variasi", "10": "10 variasi", "20": "20 variasi" }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "3", "5", "10", "20"].map((n) => (
                      <SelectItem key={n} value={n}>{n} variasi</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate {batchCount} Prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {prompts.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{prompts.length} Prompt Generated</h3>
                  <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="space-y-4">
                  {prompts.map((prompt, i) => (
                    <Card key={prompt.id} className={savedPrompts.includes(prompt.id) ? "border-primary/50 bg-primary/5" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Prompt #{i + 1}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">{prompt.aspectRatio}</Badge>
                            <Badge variant="outline" className="text-xs">{targetModel}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-muted rounded-md p-3 text-sm leading-relaxed font-mono">
                          {prompt.text}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Negative Prompt</Label>
                          <div className="bg-red-50 border border-red-100 rounded-md p-2 text-xs font-mono text-red-700 leading-relaxed">
                            {prompt.negative}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => handleCopy(`${prompt.text}\n\nNegative: ${prompt.negative}`)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => handleSave(prompt.id)}
                            disabled={savedPrompts.includes(prompt.id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {savedPrompts.includes(prompt.id) ? "Tersimpan" : "Simpan"}
                          </Button>
                          <Link
                            href={`/seo?keyword=${encodeURIComponent(keyword)}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs flex-1")}
                          >
                            <Tags className="h-3 w-3 mr-1" />
                            Buat SEO
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
                  <p className="text-sm">Isi konfigurasi di sebelah kiri</p>
                  <p className="text-sm">lalu klik Generate.</p>
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
