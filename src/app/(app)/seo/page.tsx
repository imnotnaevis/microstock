"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tags,
  Sparkles,
  Copy,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileText,
  Upload,
  X,
  CheckCheck,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { saveSeoSession, type SeoEntry } from "@/lib/history";
import { loadSettings } from "@/lib/settings";

const platformRules = {
  adobe: { maxKeywords: 49, maxTitle: 200, maxDesc: 200, platform: "Adobe Stock" },
  shutterstock: { maxKeywords: 50, maxTitle: 100, maxDesc: 400, platform: "Shutterstock" },
  vecteezy: { maxKeywords: 20, maxTitle: 120, maxDesc: 300, platform: "Vecteezy" },
};

const mockSeoResult = {
  title: "Tropical Beach Golden Hour Sunset — Summer Travel Background",
  description:
    "Beautiful tropical beach at golden hour with soft natural light, palm trees silhouetted against a warm pastel sky. Perfect for summer travel, vacation, and lifestyle concepts. High-quality stock photo with bokeh water surface and minimalist composition.",
  keywords: [
    "tropical beach", "golden hour", "summer sunset", "palm trees", "vacation background",
    "travel concept", "lifestyle photo", "warm tones", "bokeh water", "minimalist beach",
    "summer holiday", "beach sunset", "pastel sky", "nature background", "stock photo beach",
    "ocean sunset", "island paradise", "tropical vacation", "summer travel", "beach wallpaper",
    "coastal scenery", "natural light photography", "golden light beach", "sandy beach",
    "summer background", "tropical paradise", "outdoor photography", "sea horizon",
    "relaxation concept", "holiday background",
  ],
};

type SeoResult = typeof mockSeoResult;

type BulkItem = {
  id: string;
  file: File;
  preview: string;
  status: "idle" | "generating" | "done" | "error";
  result?: SeoResult;
  error?: string;
};

function ValidationIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <AlertCircle className="h-4 w-4 text-orange-500" />
  );
}

function SeoResultView({ result, rules, onCopy }: {
  result: SeoResult;
  rules: typeof platformRules[keyof typeof platformRules];
  onCopy: (text: string) => void;
}) {
  const titleLen = result.title.length;
  const descLen = result.description.length;
  const keywordCount = result.keywords.length;

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <ValidationIcon ok={titleLen <= rules.maxTitle} />
              <span>Judul: {titleLen}/{rules.maxTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ValidationIcon ok={descLen <= rules.maxDesc} />
              <span>Deskripsi: {descLen}/{rules.maxDesc}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ValidationIcon ok={keywordCount <= rules.maxKeywords} />
              <span>Keyword: {keywordCount}/{rules.maxKeywords}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Judul</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(result.title)}>
              <Copy className="h-3 w-3 mr-1" />Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{result.title}</p>
          <div className="flex items-center justify-between mt-2">
            <Progress value={(titleLen / rules.maxTitle) * 100} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground ml-2">{titleLen}/{rules.maxTitle}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Deskripsi</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(result.description)}>
              <Copy className="h-3 w-3 mr-1" />Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{result.description}</p>
          <div className="flex items-center justify-between mt-2">
            <Progress value={(descLen / rules.maxDesc) * 100} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground ml-2">{descLen}/{rules.maxDesc}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Keywords ({keywordCount}/{rules.maxKeywords})</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onCopy(result.keywords.join(", "))}>
                <Copy className="h-3 w-3 mr-1" />Koma
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onCopy(result.keywords.join("; "))}>
                <Copy className="h-3 w-3 mr-1" />Titik koma
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((kw, i) => (
              <Badge
                key={kw}
                variant={i < 10 ? "default" : "secondary"}
                className="text-xs cursor-pointer"
                onClick={() => onCopy(kw)}
              >
                {kw}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Keyword pertama (biru) = prioritas tertinggi. Klik badge untuk copy satu per satu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SEOGeneratorContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";

  const [platform, setPlatform] = useState("adobe");
  const [assetType, setAssetType] = useState("photo");
  const [keyword, setKeyword] = useState(initialKeyword);

  // Single mode
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string | null>(null);
  const [result, setResult] = useState<SeoResult | null>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);

  // Bulk mode
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const rules = platformRules[platform as keyof typeof platformRules];

  // ponytail: Vercel serverless functions cap request bodies around 4.5MB, so
  // large images can't go through /api/seo as base64 — upload straight to
  // Gemini's Files API from the browser instead, same as videos already did.
  async function uploadFileToGemini(file: File, apiKey: string, onStatus?: (s: string) => void): Promise<string> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    onStatus?.("Mengupload aset ke Gemini...");
    let uploaded;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        uploaded = await ai.files.upload({ file, config: { mimeType: file.type || "application/octet-stream" } });
        break;
      } catch (err) {
        if (attempt === 1) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    const name = uploaded!.name!;
    onStatus?.("Menunggu Gemini memproses aset...");
    for (let i = 0; i < 40; i++) {
      const info = await ai.files.get({ name });
      if (info.state === "ACTIVE") return info.uri!;
      if (info.state === "FAILED") throw new Error("Gemini gagal memproses aset");
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("Timeout menunggu Gemini memproses aset (120s)");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard!");
  }

  function handleSingleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSingleFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setSinglePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!singleFile) return;
    const { geminiKeys, geminiModel } = loadSettings();
    if (!geminiKeys.length) {
      toast.error("Tambahkan API key Gemini di halaman Settings terlebih dahulu.");
      return;
    }
    setIsGenerating(true);
    try {
      let body: Record<string, unknown>;
      if (singleFile.size > 3 * 1024 * 1024) {
        const fileUri = await uploadFileToGemini(singleFile, geminiKeys[0], setAnalyzeStatus);
        // ponytail: an uploaded file is only readable by the key that uploaded it, so don't rotate keys here.
        body = { fileUri, mimeType: singleFile.type, platform, assetType, keyword, model: geminiModel, keys: [geminiKeys[0]] };
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(singleFile!);
        });
        body = { imageBase64: base64, mimeType: singleFile.type, platform, assetType, keyword, model: geminiModel, keys: geminiKeys };
      }
      setAnalyzeStatus("Generating SEO...");
      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generate gagal");
      setResult(data);
      saveSeoSession({ platform, assetType, keyword, items: [{ fileName: singleFile!.name, result: data }] });
      toast.success("SEO metadata berhasil di-generate!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsGenerating(false);
      setAnalyzeStatus(null);
    }
  }

  function handleExportSingle(format: "csv" | "json") {
    if (!result) return;
    let content = "";
    let filename = "";
    if (format === "json") {
      content = JSON.stringify(result, null, 2);
      filename = `seo-${platform}-${Date.now()}.json`;
    } else {
      content = `Title,Description,Keywords\n"${result.title}","${result.description}","${result.keywords.join("; ")}"`;
      filename = `seo-${platform}-${Date.now()}.csv`;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    toast.success(`Diekspor sebagai ${format.toUpperCase()}!`);
  }

  function handleBulkFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems: BulkItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      status: "idle",
    }));
    setBulkItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  }

  function removeBulkItem(id: string) {
    setBulkItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleBulkGenerate() {
    const pending = bulkItems.filter((i) => i.status !== "done");
    if (!pending.length) return;
    const { geminiKeys, geminiModel } = loadSettings();
    if (!geminiKeys.length) {
      toast.error("Tambahkan API key Gemini di halaman Settings terlebih dahulu.");
      return;
    }
    setIsBulkGenerating(true);
    const completed: SeoEntry[] = [];
    let successCount = 0;
    for (const [index, item] of pending.entries()) {
      if (index > 0) {
        // Cooldown antar file (terutama video) untuk menghindari rate limit & spike demand 503
        await new Promise((r) => setTimeout(r, 2500));
      }
      setBulkItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "generating" } : i));
      try {
        // ponytail: spread uploads round-robin across configured keys so one key's quota doesn't get hammered alone.
        const uploadKey = geminiKeys[index % geminiKeys.length];
        let body: Record<string, unknown>;
        if (item.file.size > 3 * 1024 * 1024) {
          const fileUri = await uploadFileToGemini(item.file, uploadKey);
          body = { fileUri, mimeType: item.file.type, platform, assetType, keyword, model: geminiModel, keys: [uploadKey] };
        } else {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
          });
          body = { imageBase64: base64, mimeType: item.file.type, platform, assetType, keyword, model: geminiModel, keys: geminiKeys };
        }
        const res = await fetch("/api/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generate gagal");
        setBulkItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "done", result: data } : i));
        completed.push({ fileName: item.file.name, result: data });
        successCount++;
      } catch (err) {
        setBulkItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "error", error: (err as Error).message } : i));
      }
    }
    if (completed.length) saveSeoSession({ platform, assetType, keyword, items: completed });
    setIsBulkGenerating(false);
    if (successCount === pending.length) {
      toast.success(`Semua ${successCount} aset berhasil di-generate SEO-nya!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} dari ${pending.length} aset berhasil. File yang gagal bisa di-generate ulang.`);
    } else {
      toast.error("Gagal men-generate aset. Silakan periksa detail error pada masing-masing item.");
    }
  }

  function handleBulkExport() {
    const done = bulkItems.filter((i) => i.status === "done" && i.result);
    if (!done.length) return;
    const content = done
      .map((item) =>
        `# ${item.file.name}\nTitle: ${item.result!.title}\nDescription: ${item.result!.description}\nKeywords: ${item.result!.keywords.join(", ")}`
      )
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-bulk-${platform}-${Date.now()}.txt`;
    a.click();
    toast.success("Bulk export selesai!");
  }

  const bulkDoneCount = bulkItems.filter((i) => i.status === "done").length;
  const bulkProgress = bulkItems.length ? (bulkDoneCount / bulkItems.length) * 100 : 0;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="SEO Generator"
        description="Generate judul, deskripsi, dan keyword teroptimasi per platform"
      />

      <div className="flex-1 p-6">
        {/* Global config */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Platform</Label>
            <Select
              value={platform}
              onValueChange={(v) => v && setPlatform(v)}
              items={{ adobe: "Adobe Stock", shutterstock: "Shutterstock", vecteezy: "Vecteezy" }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adobe">Adobe Stock</SelectItem>
                <SelectItem value="shutterstock">Shutterstock</SelectItem>
                <SelectItem value="vecteezy">Vecteezy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipe Aset</Label>
            <Select
              value={assetType}
              onValueChange={(v) => v && setAssetType(v)}
              items={{ photo: "Foto", vector: "Vector", video: "Video", image: "Image / Ilustrasi" }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image / Ilustrasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Keyword Tambahan (opsional)</Label>
            <Input
              placeholder="mis: summer beach, golden hour..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-60"
            />
          </div>
          <div className="flex items-end">
            <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2 space-y-0.5">
              <p>Max keyword: <span className="font-medium">{rules.maxKeywords}</span></p>
              <p>Max judul: <span className="font-medium">{rules.maxTitle} karakter</span></p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="single">
          <TabsList className="mb-6">
            <TabsTrigger value="single">
              <ImageIcon className="h-4 w-4 mr-2" />
              Single Aset
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <CheckCheck className="h-4 w-4 mr-2" />
              Bulk Generate
            </TabsTrigger>
          </TabsList>

          {/* SINGLE TAB */}
          <TabsContent value="single">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Upload Aset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      ref={singleInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={handleSingleFile}
                    />

                    {singlePreview ? (
                      <div className="relative rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={singlePreview}
                          alt="Preview"
                          className="w-full h-48 object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-7 w-7 p-0 bg-background/80 hover:bg-background"
                          onClick={() => { setSingleFile(null); setSinglePreview(null); setResult(null); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2">
                          <Badge className="text-xs bg-background/90 text-foreground border">
                            {singleFile?.name}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => singleInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium text-muted-foreground">Klik untuk upload aset</span>
                        <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, MP4, MOV</span>
                      </button>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGenerate}
                      disabled={isGenerating || !singleFile}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {analyzeStatus ?? "Menganalisis & Generate..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analisis & Generate SEO
                        </>
                      )}
                    </Button>

                    {result && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportSingle("csv")}>
                          <FileText className="h-3.5 w-3.5 mr-1" />CSV
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportSingle("json")}>
                          <FileJson className="h-3.5 w-3.5 mr-1" />JSON
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                {result ? (
                  <SeoResultView result={result} rules={rules} onCopy={handleCopy} />
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-64">
                    <CardContent className="text-center text-muted-foreground py-12">
                      <Tags className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Upload aset di sebelah kiri,</p>
                      <p className="text-sm">lalu klik Generate SEO.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* BULK TAB */}
          <TabsContent value="bulk">
            <div className="space-y-4">
              {/* Upload area */}
              <input
                ref={bulkInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={handleBulkFiles}
              />

              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={() => bulkInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Tambah Aset
                </Button>
                {bulkItems.length > 0 && (
                  <>
                    <Button
                      onClick={handleBulkGenerate}
                      disabled={isBulkGenerating || bulkItems.every((i) => i.status === "done")}
                    >
                      {isBulkGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Semua ({bulkItems.filter((i) => i.status !== "done").length})
                        </>
                      )}
                    </Button>
                    {bulkDoneCount > 0 && (
                      <Button variant="outline" onClick={handleBulkExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Semua ({bulkDoneCount})
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setBulkItems([])}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hapus Semua
                    </Button>
                  </>
                )}
              </div>

              {bulkItems.length > 0 && isBulkGenerating && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress: {bulkDoneCount}/{bulkItems.length}</span>
                    <span>{Math.round(bulkProgress)}%</span>
                  </div>
                  <Progress value={bulkProgress} className="h-2" />
                </div>
              )}

              {bulkItems.length === 0 ? (
                <button
                  type="button"
                  onClick={() => bulkInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">Upload beberapa aset sekaligus</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, MP4, MOV — bisa pilih banyak file</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {bulkItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-20 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                            <img
                              src={item.preview}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info + Result */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{item.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.status === "idle" && (
                                  <Badge variant="outline" className="text-xs">Menunggu</Badge>
                                )}
                                {item.status === "generating" && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Generating
                                  </Badge>
                                )}
                                {item.status === "done" && (
                                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200 border">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Selesai
                                  </Badge>
                                )}
                                {item.status === "error" && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Gagal
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => removeBulkItem(item.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {item.status === "error" && (
                              <p className="mt-2 text-xs text-destructive">{item.error}</p>
                            )}

                            {item.status === "done" && item.result && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium truncate">{item.result.title}</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.result.keywords.slice(0, 8).map((kw) => (
                                    <Badge key={kw} variant="secondary" className="text-[10px] py-0 h-4">{kw}</Badge>
                                  ))}
                                  {item.result.keywords.length > 8 && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                                      +{item.result.keywords.length - 8}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-1.5 mt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleCopy(item.result!.title)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Judul
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleCopy(item.result!.keywords.join(", "))}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Keyword
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SEOPage() {
  return (
    <Suspense>
      <SEOGeneratorContent />
    </Suspense>
  );
}
