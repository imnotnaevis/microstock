"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { loadSettings } from "@/lib/settings";
import { savePromptSession } from "@/lib/history";
import { saveOrUpdateSeoAsset, createThumbnail } from "@/lib/library";

export type PromptItem = {
  id: string;
  text: string;
  negative: string;
  aspectRatio: string;
  aspectRatioReason?: string;
};

export type PromptFormState = {
  keyword: string;
  temaUtama: string;
  targetModel: string;
  assetType: string;
  themes: string;
  style: string;
  brief: string;
  batchCount: string;
  selectedRatio: string;
  seamless: boolean;
  abstrak: boolean;
  iconSet: boolean;
  contextPreview: string | null;
};

export type SeoResult = {
  title: string;
  description: string;
  keywords: string[];
  adobeStockCompliance?: {
    isAiGenerated: boolean;
    hasFictionalPeopleOrProperty: boolean;
    recommendedCheckboxes: string[];
    category: string;
    antiNewsworthyVerified?: boolean;
    complianceNotes: string;
  };
};

export type BulkItem = {
  id: string;
  file: File;
  preview: string;
  previewSrc?: string;
  status: "idle" | "generating" | "done" | "error";
  result?: SeoResult;
  error?: string;
};

interface GeneratorContextType {
  // PROMPT
  promptForm: PromptFormState;
  updatePromptForm: (updates: Partial<PromptFormState>) => void;
  prompts: PromptItem[];
  setPrompts: React.Dispatch<React.SetStateAction<PromptItem[]>>;
  isPromptGenerating: boolean;
  promptError: string | null;
  isPromptQuotaError: boolean;
  clearPromptError: () => void;
  startPromptGeneration: (customParams?: Partial<PromptFormState>) => Promise<void>;
  savedPrompts: string[];
  savePromptId: (id: string) => void;

  // SEO
  seoPlatform: string;
  setSeoPlatform: (p: string) => void;
  seoAssetType: string;
  setSeoAssetType: (t: string) => void;
  seoKeyword: string;
  setSeoKeyword: (k: string) => void;
  seoSinglePreview: string | null;
  seoSingleFileName: string | null;
  setSeoSingleAsset: (data: { preview: string | null; fileName: string | null }) => void;
  seoResult: SeoResult | null;
  setSeoResult: (r: SeoResult | null) => void;
  isSeoGenerating: boolean;
  seoAnalyzeStatus: string | null;
  seoError: string | null;
  isSeoQuotaError: boolean;
  clearSeoError: () => void;
  startSingleSeoGeneration: (file: File) => Promise<void>;
  bulkItems: BulkItem[];
  setBulkItems: React.Dispatch<React.SetStateAction<BulkItem[]>>;
  isBulkGenerating: boolean;
  startBulkSeoGeneration: () => Promise<void>;
}

const GeneratorContext = createContext<GeneratorContextType | null>(null);

const STORAGE_PROMPT_KEY = "microstock_active_prompt_v2";
const STORAGE_SEO_KEY = "microstock_active_seo_v2";

const defaultPromptForm: PromptFormState = {
  keyword: "Animal",
  temaUtama: "",
  targetModel: "",
  assetType: "image",
  themes: "",
  style: "",
  brief: "",
  batchCount: "3",
  selectedRatio: "auto",
  seamless: false,
  abstrak: false,
  iconSet: false,
  contextPreview: null,
};

export function GeneratorProvider({ children }: { children: React.ReactNode }) {
  // PROMPT STATE
  const [promptForm, setPromptForm] = useState<PromptFormState>(defaultPromptForm);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isPromptGenerating, setIsPromptGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isPromptQuotaError, setIsPromptQuotaError] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);

  // SEO STATE
  const [seoPlatform, setSeoPlatform] = useState("adobe");
  const [seoAssetType, setSeoAssetType] = useState("photo");
  const [seoKeyword, setSeoKeyword] = useState("");
  const [seoSinglePreview, setSeoSinglePreview] = useState<string | null>(null);
  const [seoSingleFileName, setSeoSingleFileName] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
  const [isSeoGenerating, setIsSeoGenerating] = useState(false);
  const [seoAnalyzeStatus, setSeoAnalyzeStatus] = useState<string | null>(null);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [isSeoQuotaError, setIsSeoQuotaError] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Restore on mount
  useEffect(() => {
    try {
      const savedPrompt = localStorage.getItem(STORAGE_PROMPT_KEY);
      if (savedPrompt) {
        const parsed = JSON.parse(savedPrompt);
        if (parsed.form) setPromptForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed.prompts && Array.isArray(parsed.prompts)) setPrompts(parsed.prompts);
      }
    } catch {}

    try {
      const savedSeo = localStorage.getItem(STORAGE_SEO_KEY);
      if (savedSeo) {
        const parsed = JSON.parse(savedSeo);
        if (parsed.platform) setSeoPlatform(parsed.platform);
        if (parsed.assetType) setSeoAssetType(parsed.assetType);
        if (parsed.keyword) setSeoKeyword(parsed.keyword);
        if (parsed.result) setSeoResult(parsed.result);
        if (parsed.singlePreview) setSeoSinglePreview(parsed.singlePreview);
        if (parsed.singleFileName) setSeoSingleFileName(parsed.singleFileName);
      }
    } catch {}
  }, []);

  // Sync prompt to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_PROMPT_KEY,
        JSON.stringify({
          form: promptForm,
          prompts,
        })
      );
    } catch {}
  }, [promptForm, prompts]);

  // Sync SEO to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_SEO_KEY,
        JSON.stringify({
          platform: seoPlatform,
          assetType: seoAssetType,
          keyword: seoKeyword,
          result: seoResult,
          singlePreview: seoSinglePreview,
          singleFileName: seoSingleFileName,
        })
      );
    } catch {}
  }, [seoPlatform, seoAssetType, seoKeyword, seoResult, seoSinglePreview, seoSingleFileName]);

  const updatePromptForm = useCallback((updates: Partial<PromptFormState>) => {
    setPromptForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const savePromptId = useCallback((id: string) => {
    setSavedPrompts((prev) => [...prev, id]);
  }, []);

  const clearPromptError = useCallback(() => {
    setPromptError(null);
    setIsPromptQuotaError(false);
  }, []);

  const clearSeoError = useCallback(() => {
    setSeoError(null);
    setIsSeoQuotaError(false);
  }, []);

  const setSeoSingleAsset = useCallback((data: { preview: string | null; fileName: string | null }) => {
    setSeoSinglePreview(data.preview);
    setSeoSingleFileName(data.fileName);
    setSeoResult(null);
    setSeoError(null);
    setIsSeoQuotaError(false);
  }, []);

  // START PROMPT GENERATION
  const startPromptGeneration = useCallback(
    async (customParams?: Partial<PromptFormState>) => {
      const activeForm = { ...promptForm, ...customParams };

      if (!activeForm.targetModel) {
        toast.error("Silakan pilih Target Model AI terlebih dahulu!");
        return;
      }

      const { geminiKeys, geminiModel } = loadSettings();
      setIsPromptGenerating(true);
      setPromptError(null);
      setIsPromptQuotaError(false);

      // Timeout 40s with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      try {
        const res = await fetch("/api/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            keyword: activeForm.temaUtama.trim() || activeForm.keyword,
            themes: activeForm.themes,
            style: activeForm.style,
            brief: activeForm.brief,
            assetType: activeForm.assetType,
            targetModel: activeForm.targetModel,
            count: activeForm.batchCount,
            model: geminiModel,
            keys: geminiKeys || [],
            seamless: activeForm.seamless,
            abstrak: activeForm.abstrak,
            iconSet: activeForm.iconSet,
            selectedRatio: activeForm.selectedRatio,
          }),
        });

        clearTimeout(timeoutId);

        let data: { error?: string; isQuotaExhausted?: boolean } | PromptItem[];
        try {
          data = await res.json();
        } catch {
          throw new Error("Server tidak merespons dengan JSON valid (kemungkinan timeout). Silakan coba lagi.");
        }

        if (!res.ok || (data && !Array.isArray(data) && data.error)) {
          const errObj = data as { error?: string; isQuotaExhausted?: boolean };
          const isQuota = res.status === 429 || !!errObj.isQuotaExhausted;
          setIsPromptQuotaError(isQuota);
          throw new Error(errObj.error || "Gagal men-generate prompt.");
        }

        const promptList = data as PromptItem[];
        setPrompts(promptList);

        const historyKeyword =
          activeForm.temaUtama.trim() ||
          (activeForm.assetType === "video" && (activeForm.seamless || activeForm.abstrak)
            ? [activeForm.seamless && "Seamless", activeForm.abstrak && "Abstrak"].filter(Boolean).join(" + ")
            : activeForm.keyword);

        savePromptSession({
          keyword: historyKeyword,
          assetType: activeForm.assetType,
          targetModel: activeForm.targetModel,
          themes: activeForm.themes,
          style: activeForm.style,
          prompts: promptList.map((p) => ({
            text: p.text,
            negative: p.negative,
            aspectRatio: p.aspectRatio,
            aspectRatioReason: p.aspectRatioReason,
          })),
        });

        toast.success(`${promptList.length} prompt siap dipakai!`);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const isAbort = (err as Error)?.name === "AbortError";
        const msg = isAbort
          ? "Waktu tunggu request habis (Timeout 40 detik). Server AI sedang padat. Silakan coba klik tombol Generate lagi."
          : (err as Error)?.message || "Terjadi kesalahan saat generate.";

        setPromptError(msg);
        if (
          msg.includes("429") ||
          msg.toLowerCase().includes("quota") ||
          msg.toLowerCase().includes("rate limit")
        ) {
          setIsPromptQuotaError(true);
        }
        toast.error(msg);
      } finally {
        setIsPromptGenerating(false);
      }
    },
    [promptForm]
  );

  // Gemini file uploader
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
    for (let i = 0; i < 30; i++) {
      const info = await ai.files.get({ name });
      if (info.state === "ACTIVE") return info.uri!;
      if (info.state === "FAILED") throw new Error("Gemini gagal memproses aset");
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Timeout menunggu Gemini memproses aset (60s)");
  }

  // START SINGLE SEO GENERATION
  const startSingleSeoGeneration = useCallback(
    async (file: File) => {
      const { geminiKeys, geminiModel } = loadSettings();
      setIsSeoGenerating(true);
      setSeoError(null);
      setIsSeoQuotaError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        let body: Record<string, unknown>;
        if (file.size > 3 * 1024 * 1024 && geminiKeys?.[0]) {
          const fileUri = await uploadFileToGemini(file, geminiKeys[0], setSeoAnalyzeStatus);
          body = {
            fileUri,
            mimeType: file.type,
            platform: seoPlatform,
            assetType: seoAssetType,
            keyword: seoKeyword,
            model: geminiModel,
            keys: [geminiKeys[0]],
          };
        } else {
          setSeoAnalyzeStatus("Membaca file aset...");
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          body = {
            imageBase64: base64,
            mimeType: file.type,
            platform: seoPlatform,
            assetType: seoAssetType,
            keyword: seoKeyword,
            model: geminiModel,
            keys: geminiKeys || [],
          };
        }

        setSeoAnalyzeStatus("Menganalisis & generate SEO komersial...");
        const res = await fetch("/api/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        clearTimeout(timeoutId);

        let data: SeoResult & { error?: string; isQuotaExhausted?: boolean };
        try {
          data = await res.json();
        } catch {
          throw new Error("Server tidak merespons dengan JSON valid. Silakan coba lagi.");
        }

        if (!res.ok || data.error) {
          const isQuota = res.status === 429 || !!data.isQuotaExhausted;
          setIsSeoQuotaError(isQuota);
          throw new Error(data.error || "Generate SEO gagal.");
        }

        setSeoResult(data);

        // Auto-save ke Koleksi Aset
        try {
          const thumb = await createThumbnail(file);
          saveOrUpdateSeoAsset({
            title: data.title,
            type: seoAssetType,
            category: data.adobeStockCompliance?.category || seoKeyword.trim() || "Photos",
            thumbnail: thumb,
            status: "in_review",
            seoData: {
              title: data.title,
              description: data.description,
              keywords: data.keywords,
            },
            adobeStockCompliance: data.adobeStockCompliance,
          });
          toast.success("SEO berhasil & aset tersimpan di Koleksi Aset!");
        } catch {
          toast.success("SEO metadata berhasil di-generate!");
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const isAbort = (err as Error)?.name === "AbortError";
        const msg = isAbort
          ? "Waktu request habis (Timeout 60 detik). Server AI sedang padat. Silakan coba klik Generate lagi."
          : (err as Error)?.message || "Gagal men-generate SEO.";

        setSeoError(msg);
        if (
          msg.includes("429") ||
          msg.toLowerCase().includes("quota") ||
          msg.toLowerCase().includes("rate limit")
        ) {
          setIsSeoQuotaError(true);
        }
        toast.error(msg);
      } finally {
        setIsSeoGenerating(false);
        setSeoAnalyzeStatus(null);
      }
    },
    [seoPlatform, seoAssetType, seoKeyword]
  );

  // START BULK SEO GENERATION
  const startBulkSeoGeneration = useCallback(async () => {
    const pending = bulkItems.filter((i) => i.status !== "done");
    if (!pending.length) return;

    const { geminiKeys, geminiModel } = loadSettings();
    setIsBulkGenerating(true);
    let successCount = 0;

    for (const [index, item] of pending.entries()) {
      if (index > 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      setBulkItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "generating" } : i))
      );

      try {
        let body: Record<string, unknown>;
        if (item.file.size > 3 * 1024 * 1024 && geminiKeys?.[0]) {
          const uploadKey = geminiKeys[index % geminiKeys.length];
          const fileUri = await uploadFileToGemini(item.file, uploadKey);
          body = {
            fileUri,
            mimeType: item.file.type,
            platform: seoPlatform,
            assetType: seoAssetType,
            keyword: seoKeyword,
            model: geminiModel,
            keys: [uploadKey],
          };
        } else {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
          });
          body = {
            imageBase64: base64,
            mimeType: item.file.type,
            platform: seoPlatform,
            assetType: seoAssetType,
            keyword: seoKeyword,
            model: geminiModel,
            keys: geminiKeys || [],
          };
        }

        const res = await fetch("/api/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Generate gagal");

        setBulkItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done", result: data } : i))
        );

        // Auto-save bulk to Koleksi Aset
        try {
          const thumb = await createThumbnail(item.file);
          saveOrUpdateSeoAsset({
            title: data.title,
            type: seoAssetType,
            category: data.adobeStockCompliance?.category || seoKeyword.trim() || "Photos",
            thumbnail: thumb,
            status: "in_review",
            seoData: {
              title: data.title,
              description: data.description,
              keywords: data.keywords,
            },
            adobeStockCompliance: data.adobeStockCompliance,
          });
        } catch {}

        successCount++;
      } catch (err: unknown) {
        const msg = (err as Error)?.message || "Gagal";
        setBulkItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: msg } : i))
        );
      }
    }

    setIsBulkGenerating(false);
    if (successCount === pending.length) {
      toast.success(`Semua ${successCount} aset berhasil di-generate SEO-nya!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} dari ${pending.length} aset berhasil.`);
    } else {
      toast.error("Gagal men-generate aset bulk. Cek kuota API Gemini Anda.");
    }
  }, [bulkItems, seoPlatform, seoAssetType, seoKeyword]);

  return (
    <GeneratorContext.Provider
      value={{
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

        seoPlatform,
        setSeoPlatform,
        seoAssetType,
        setSeoAssetType,
        seoKeyword,
        setSeoKeyword,
        seoSinglePreview,
        seoSingleFileName,
        setSeoSingleAsset,
        seoResult,
        setSeoResult,
        isSeoGenerating,
        seoAnalyzeStatus,
        seoError,
        isSeoQuotaError,
        clearSeoError,
        startSingleSeoGeneration,
        bulkItems,
        setBulkItems,
        isBulkGenerating,
        startBulkSeoGeneration,
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const ctx = useContext(GeneratorContext);
  if (!ctx) {
    throw new Error("useGenerator must be used within a GeneratorProvider");
  }
  return ctx;
}
