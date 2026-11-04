"use client";

import { useState, useRef, Suspense, useEffect } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { saveSeoSession, type SeoEntry } from "@/lib/history";
import { loadSettings } from "@/lib/settings";
import { saveOrUpdateSeoAsset, createThumbnail } from "@/lib/library";
import { useGenerator, type SeoResult, type BulkItem } from "@/context/generator-context";
import { QuotaAlert } from "@/components/ui/quota-alert";

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
  adobeStockCompliance: {
    isAiGenerated: true,
    hasFictionalPeopleOrProperty: false,
    recommendedCheckboxes: ["Created using generative AI tools"],
    category: "Photos",
    complianceNotes: "100% Bebas merek dagang, nama tokoh, dan nama artis.",
  },
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
      {/* Adobe Stock Generative AI Compliance Checklist */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900 dark:text-amber-300">
              <CheckCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Checklist Submit Adobe Stock (Pedoman Konten AI)</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background border-amber-300 text-amber-800 dark:text-amber-300 font-semibold">
              Kategori: {result.adobeStockCompliance?.category || "Photos"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs">
          <div className="text-[11px] text-muted-foreground">
            Sesuai pedoman resmi Adobe Stock (Updated 2026), centang opsi berikut di portal kontributor sebelum submit:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-md bg-background border border-amber-200/60 dark:border-amber-900/40">
              <input
                type="checkbox"
                checked
                readOnly
                className="mt-0.5 h-3.5 w-3.5 accent-primary cursor-default"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Created using generative AI tools</span>
                <p className="text-[10px] text-muted-foreground">Wajib dicentang untuk semua aset buatan AI.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-md bg-background border border-amber-200/60 dark:border-amber-900/40">
              <input
                type="checkbox"
                checked={result.adobeStockCompliance?.hasFictionalPeopleOrProperty ?? false}
                readOnly
                className="mt-0.5 h-3.5 w-3.5 accent-primary cursor-default"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">People and Property are fictional</span>
                <p className="text-[10px] text-muted-foreground">
                  {result.adobeStockCompliance?.hasFictionalPeopleOrProperty
                    ? "Centang: Menampilkan orang/properti fiktif (bebas model release)."
                    : "Biarkan kosong jika tidak ada orang/bangunan yang dapat dikenali."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
              <span>Kepatuhan Aman: Judul & Keyword 100% bebas nama artis, tokoh nyata, dan merek dagang.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Anti-Newsworthy Verified: Judul dikunci sebagai konsep komersial/kreatif (bebas klaim berita/editorial aktual).</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/40">
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

  const {
    seoPlatform: platform,
    setSeoPlatform: setPlatform,
    seoAssetType: assetType,
    setSeoAssetType: setAssetType,
    seoKeyword: keyword,
    setSeoKeyword: setKeyword,
    seoSinglePreview: singlePreview,
    seoSingleFileName: singleFileName,
    setSeoSingleAsset,
    seoResult: result,
    setSeoResult: setResult,
    isSeoGenerating: isGenerating,
    seoAnalyzeStatus: analyzeStatus,
    seoError,
    isSeoQuotaError,
    clearSeoError,
    startSingleSeoGeneration,
    bulkItems,
    setBulkItems,
    isBulkGenerating,
    startBulkSeoGeneration,
  } = useGenerator();

  const [singleFile, setSingleFile] = useState<File | null>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const rules = platformRules[platform as keyof typeof platformRules];

  // Sinkronkan initial keyword jika ada dari query params
  useEffect(() => {
    if (initialKeyword && !keyword) {
      setKeyword(initialKeyword);
    }
  }, [initialKeyword, keyword, setKeyword]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard!");
  }

  function handleSingleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSingleFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSeoSingleAsset({ preview: ev.target?.result as string, fileName: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!singleFile) {
      if (singlePreview) {
        toast.info("Aset sebelumnya masih tersimpan. Untuk generate ulang, silakan klik 'Ganti / Upload Aset' di bawah preview.");
      } else {
        toast.error("Silakan pilih file aset terlebih dahulu!");
      }
      return;
    }
    await startSingleSeoGeneration(singleFile);
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
    await startBulkSeoGeneration();
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
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={singlePreview}
                            alt="Preview"
                            className="w-full h-48 object-contain"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-7 w-7 p-0 bg-background/80 hover:bg-background cursor-pointer"
                            onClick={() => {
                              setSingleFile(null);
                              setSeoSingleAsset({ preview: null, fileName: null });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="absolute bottom-2 left-2">
                            <Badge className="text-xs bg-background/90 text-foreground border">
                              {singleFile?.name || singleFileName || "Aset Terpilih"}
                            </Badge>
                          </div>
                        </div>
                        {!singleFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => singleInputRef.current?.click()}
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Ganti / Upload File Baru
                          </Button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => singleInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium text-muted-foreground">Klik untuk upload aset</span>
                        <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, MP4, MOV</span>
                      </button>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGenerate}
                      disabled={isGenerating || (!singleFile && !singlePreview)}
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

              <div className="lg:col-span-3 space-y-4">
                {isSeoQuotaError && (
                  <QuotaAlert
                    message={seoError || undefined}
                    onRetry={() => { if (singleFile) handleGenerate(); }}
                    onDismiss={clearSeoError}
                  />
                )}

                {seoError && !isSeoQuotaError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-xs text-red-800 dark:text-red-300 flex items-start justify-between gap-2 shadow-xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Gagal Generate SEO:</span> {seoError}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800 cursor-pointer"
                      onClick={clearSeoError}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

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
              {isSeoQuotaError && (
                <QuotaAlert
                  message={seoError || undefined}
                  onRetry={handleBulkGenerate}
                  onDismiss={clearSeoError}
                />
              )}
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
