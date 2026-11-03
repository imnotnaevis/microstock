"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Save,
  Wand2,
  Copy,
  AlertTriangle,
  Loader2,
  Camera,
  Palette,
  Sun,
  Aperture,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loadSettings } from "@/lib/settings";

type AnalysisResult = {
  composition: string;
  lighting: string;
  palette: string[];
  mood: string;
  lensEffect: string;
  era: string;
  stylePrompt: string;
  tags: string[];
};

export default function CopyStyleImagePage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    const { geminiKeys, geminiModel } = loadSettings();
    if (!geminiKeys.length) {
      toast.error("Tambahkan API key Gemini di halaman Settings terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    try {
      let body: Record<string, unknown> = { model: geminiModel, keys: geminiKeys };

      if (previewSrc) {
        const [prefix, data] = previewSrc.split(",");
        const mimeType = prefix.match(/data:([^;]+)/)?.[1] || "image/jpeg";
        body = { ...body, imageBase64: data, mimeType };
      } else if (urlInput) {
        body = { ...body, imageUrl: urlInput };
      } else {
        toast.error("Upload gambar atau masukkan URL terlebih dahulu.");
        return;
      }

      const res = await fetch("/api/copy-style/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analisis gagal");
      setResult(data);
      localStorage.setItem("lastAnalysisContext", JSON.stringify({
        style: data.stylePrompt,
        themes: data.tags.join(", "),
        assetType: "image",
        previewSrc: urlInput || null,
        source: "Foto / Gambar",
      }));
      toast.success("Analisis selesai!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSavePreset() {
    toast.success("Style preset disimpan ke library!");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard!");
  }

  function handleGoToGenerator() {
    if (!result) return;
    sessionStorage.setItem("promptContext", JSON.stringify({
      style: result.stylePrompt,
      themes: result.tags.join(", "),
      keyword: result.mood.split(",")[0].trim(),
      previewSrc: previewSrc || urlInput || null,
      assetType: "image",
    }));
    router.push("/prompt");
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Copy Style — Foto / Gambar"
        description="Analisis gaya visual foto referensi dan konversi ke style preset"
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload atau URL Referensi</CardTitle>
                <CardDescription>
                  Sistem menganalisis komposisi, lighting, palet warna, mood, dan lensa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "upload" | "url")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="upload" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex-1">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Dari URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      {previewSrc ? (
                        <img src={previewSrc} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Camera className="h-8 w-8" />
                          <span className="text-sm font-medium">Klik atau drag foto ke sini</span>
                          <span className="text-xs">JPG, PNG, WebP (maks. 10MB)</span>
                        </div>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </TabsContent>

                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-2">
                      <Label>URL Gambar</Label>
                      <Input
                        placeholder="https://..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        URL gambar dari Adobe Stock, Shutterstock, atau sumber publik.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Guardrail: Sistem meniru gaya/estetika, bukan menyalin karya berhak cipta secara identik.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!previewSrc && !urlInput)}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analisis Gaya
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            {result ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Hasil Analisis Style</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSavePreset}>
                        <Save className="h-4 w-4 mr-1" />
                        Simpan Preset
                      </Button>
                      <Button size="sm" onClick={handleGoToGenerator}>
                        <Wand2 className="h-4 w-4 mr-1" />
                        Ke Generator
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Layers className="h-3 w-3" /> Komposisi
                      </div>
                      <p className="text-sm">{result.composition}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Sun className="h-3 w-3" /> Lighting
                      </div>
                      <p className="text-sm">{result.lighting}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Aperture className="h-3 w-3" /> Lensa / Depth
                      </div>
                      <p className="text-sm">{result.lensEffect}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Era</div>
                      <p className="text-sm">{result.era}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mood</div>
                    <p className="text-sm">{result.mood}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Palette className="h-3 w-3" /> Palet Warna
                    </div>
                    <div className="flex gap-2">
                      {(result.palette ?? []).map((color) => (
                        <div key={color} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 h-8 rounded-md border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                            onClick={() => handleCopy(color)}
                          />
                          <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Style Prompt
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleCopy(result.stylePrompt)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted rounded-md p-3 text-sm font-mono leading-relaxed">
                      {result.stylePrompt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-64">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Camera className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Upload atau masukkan URL gambar referensi,</p>
                  <p className="text-sm">lalu klik Analisis Gaya.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
