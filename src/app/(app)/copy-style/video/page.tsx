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
  Video,
  Film,
  Clapperboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loadSettings } from "@/lib/settings";

type VideoAnalysisResult = {
  pacing: string;
  cameraMovement: string;
  colorGrading: string;
  lighting: string;
  mood: string;
  shotTypes: string[];
  aspectRatio: string;
  duration: string;
  stylePrompt: string;
  tags: string[];
};

export default function CopyStyleVideoPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyzeStatus, setAnalyzeStatus] = useState<string | null>(null);

  async function uploadVideoToGemini(file: File, apiKey: string): Promise<string> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    setAnalyzeStatus("Mengupload video ke Gemini...");
    const uploaded = await ai.files.upload({ file, config: { mimeType: file.type || "video/mp4" } });
    const name = uploaded.name!;

    setAnalyzeStatus("Menunggu Gemini memproses video...");
    for (let i = 0; i < 30; i++) {
      const info = await ai.files.get({ name });
      if (info.state === "ACTIVE") return info.uri!;
      if (info.state === "FAILED") throw new Error("Gemini gagal memproses video");
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error("Timeout menunggu video diproses Gemini (90s)");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("Video terlalu besar (maks 200MB).");
      return;
    }
    setVideoName(file.name);
    setVideoFile(file);
  }

  async function handleAnalyze() {
    const { geminiKeys, geminiModel } = loadSettings();
    if (!geminiKeys.length) {
      toast.error("Tambahkan API key Gemini di halaman Settings terlebih dahulu.");
      return;
    }

    if (!videoFile && !urlInput) {
      toast.error("Upload video atau masukkan URL terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeStatus("Mempersiapkan...");
    try {
      let body: object;
      if (videoFile) {
        const fileUri = await uploadVideoToGemini(videoFile, geminiKeys[0]);
        setAnalyzeStatus("Menganalisis gaya video...");
        body = { fileUri, mimeType: videoFile.type || "video/mp4", model: geminiModel, keys: geminiKeys };
      } else {
        setAnalyzeStatus("Menganalisis gaya video...");
        body = { videoUrl: urlInput, model: geminiModel, keys: geminiKeys };
      }
      const res = await fetch("/api/copy-style/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analisis gagal");
      setResult(data);
      localStorage.setItem("lastAnalysisContext", JSON.stringify({
        style: data.stylePrompt,
        themes: data.tags.join(", "),
        assetType: "video",
        previewSrc: urlInput || null,
        source: "Video",
      }));
      toast.success("Analisis video selesai!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAnalyzing(false);
      setAnalyzeStatus(null);
    }
  }

  function handleSavePreset() {
    toast.success("Video style preset disimpan!");
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
      previewSrc: null,
      assetType: "video",
    }));
    router.push("/prompt");
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Copy Style — Video"
        description="Analisis gaya sinematik video referensi dan konversi ke style preset"
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload atau URL Video Referensi</CardTitle>
                <CardDescription>
                  Sistem menganalisis pacing, color grading, gerakan kamera, shot types, dan mood sinematik.
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
                      URL / YouTube
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Video className="h-8 w-8" />
                        {videoName ? (
                          <span className="text-sm font-medium text-foreground">{videoName}</span>
                        ) : (
                          <>
                            <span className="text-sm font-medium">Klik atau drag video ke sini</span>
                            <span className="text-xs">MP4, MOV, WebM (maks. 200MB)</span>
                          </>
                        )}
                      </div>
                    </label>
                    <input id="video-upload" type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
                  </TabsContent>

                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-2">
                      <Label>URL Video</Label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Dukung: YouTube, Vimeo, URL video MP4 langsung.</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Guardrail: Fokus meniru gaya sinematik (color grade, pacing, komposisi), bukan konten asli video.
                  </p>
                </div>

                <Button className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {analyzeStatus ?? "Memproses..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analisis Gaya Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div>
            {result ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Hasil Analisis Style Video</CardTitle>
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
                    {[
                      { label: "Pacing & FPS", value: result.pacing, Icon: Film },
                      { label: "Gerakan Kamera", value: result.cameraMovement, Icon: Clapperboard },
                      { label: "Color Grading", value: result.colorGrading, Icon: Clapperboard },
                      { label: "Lighting", value: result.lighting, Icon: Clapperboard },
                      { label: "Aspect Ratio", value: result.aspectRatio, Icon: Film },
                      { label: "Durasi Ideal", value: result.duration, Icon: Film },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <Icon className="h-3 w-3" /> {label}
                        </div>
                        <p className="text-sm">{value}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mood</div>
                    <p className="text-sm">{result.mood}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shot Types</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.shotTypes ?? []).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(result.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Prompt</div>
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
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Upload atau masukkan URL video referensi,</p>
                  <p className="text-sm">lalu klik Analisis Gaya Video.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
