import { NextResponse } from "next/server";
import { withGemini, buildModelChain, resolveGeminiKeys } from "@/lib/gemini";

const platformLimits: Record<string, { name: string; maxTitle: number; maxDesc: number; maxKeywords: number }> = {
  adobe:       { name: "Adobe Stock",   maxTitle: 200, maxDesc: 200, maxKeywords: 49 },
  shutterstock:{ name: "Shutterstock",  maxTitle: 100, maxDesc: 400, maxKeywords: 50 },
  vecteezy:    { name: "Vecteezy",      maxTitle: 120, maxDesc: 300, maxKeywords: 20 },
};

function buildPrompt(platformKey: string, assetType: string, keyword: string) {
  const p = platformLimits[platformKey] ?? platformLimits.adobe;
  return `Kamu adalah SEO specialist microstock profesional yang sangat mematuhi Pedoman Konten Generative AI resmi (Adobe Stock, Shutterstock, Vecteezy). Analisis gambar/aset ini dan buat metadata SEO yang siap submit.

PEDOMAN KEPATUHAN GENERATIVE AI (WAJIB DIPATUHI):
1. DILARANG KERAS menyertakan:
   - Nama seniman/artis (misal: Greg Rutkowski, Studio Ghibli, dll)
   - Nama orang nyata atau tokoh terkenal
   - Karakter fiksi berhak cipta (Disney, Marvel, Pokemon, dll)
   - Nama agensi/lembaga pemerintah (FBI, CIA, NASA, Kepolisian, dll)
   - Merek dagang pihak ketiga (Apple, Nike, Starbucks, dll)
   - Klaim atau deskripsi yang menyiratkan peristiwa berita nyata (deceptive newsworthy claims)
2. Klasifikasikan tipe konten:
   - Photos: jika foto realistis menyerupai jepretan kamera dan mematuhi anatomi manusia/hewan
   - Illustrations: jika berupa seni grafis, konsep fantasi, lukisan, atau render artistik
   - Vectors: jika grafis vektor
   - Videos: jika rekaman bergerak
3. Tentukan apakah gambar menampilkan orang fiktif atau properti fiktif (fictional people/property).

Buat metadata dalam bahasa Inggris. Return HANYA objek JSON valid tanpa teks lain:

{
  "title": "<judul SEO maks ${p.maxTitle} karakter, deskriptif, bebas brand/nama artis, sentence case (kapital hanya di awal kalimat)>",
  "description": "<deskripsi maks ${p.maxDesc} karakter, jelas, informatif, bebas klaim berita>",
  "keywords": ["<keyword1>", "<keyword2>", ...],
  "adobeStockCompliance": {
    "isAiGenerated": true,
    "hasFictionalPeopleOrProperty": <true jika menampilkan manusia/bangunan fiktif, false jika alam/objek murni>,
    "recommendedCheckboxes": [
      "Created using generative AI tools"
    ],
    "category": "<Photos | Illustrations | Vectors | Videos>",
    "complianceNotes": "100% Bebas merek dagang, nama tokoh, dan nama seniman. Aman untuk lisensi komersial Adobe Stock."
  }
}

Tipe aset: ${assetType}
${keyword ? `Keyword tambahan: ${keyword}` : ""}
Maksimum ${p.maxKeywords} keyword, urutkan dari paling relevan ke paling umum, semua huruf kecil, tanpa duplikat.
Jangan melebihi batas karakter dan jumlah keyword.`;
}

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\{[\s\S]*\}/)?.[0] ?? text.trim();
}

// Sentence case: capital only at the start and after ". ", everything else lowercase.
function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
}

// ponytail: model doesn't reliably obey the prompt's limits/casing/punctuation rules, so enforce them here as the single source of truth.
function sanitizeSeo(
  raw: {
    title?: string;
    description?: string;
    keywords?: string[];
    adobeStockCompliance?: {
      isAiGenerated?: boolean;
      hasFictionalPeopleOrProperty?: boolean;
      recommendedCheckboxes?: string[];
      category?: string;
      complianceNotes?: string;
    };
  },
  limits: { maxTitle: number; maxDesc: number; maxKeywords: number }
) {
  const title = toSentenceCase((raw.title ?? "").trim().replace(/\.+$/, "")).slice(0, limits.maxTitle).trim();
  const description = (raw.description ?? "").trim().slice(0, limits.maxDesc).trim();
  const keywords = [...new Set((raw.keywords ?? []).map((k) => String(k).trim().toLowerCase()).filter(Boolean))]
    .slice(0, limits.maxKeywords);

  const hasFictional = raw.adobeStockCompliance?.hasFictionalPeopleOrProperty ?? false;
  const checkboxes = ["Created using generative AI tools"];
  if (hasFictional) {
    checkboxes.push("People and Property are fictional");
  }

  const adobeStockCompliance = {
    isAiGenerated: true,
    hasFictionalPeopleOrProperty: hasFictional,
    recommendedCheckboxes: checkboxes,
    category: raw.adobeStockCompliance?.category || "Photos",
    complianceNotes:
      raw.adobeStockCompliance?.complianceNotes ||
      "100% Bebas merek dagang, nama tokoh, dan nama artis. Aman untuk Adobe Stock.",
  };

  return { ...raw, title, description, keywords, adobeStockCompliance };
}

export async function POST(req: Request) {
  try {
    const { imageBase64, fileUri, mimeType, platform, assetType, keyword, model, keys } = await req.json();
    const effectiveKeys = resolveGeminiKeys(keys);

    if (!effectiveKeys.length) {
      return NextResponse.json({ error: "Belum ada API key. Tambahkan GEMINI_API_KEY di Vercel atau halaman Settings." }, { status: 400 });
    }
    if (!imageBase64 && !fileUri) {
      return NextResponse.json({ error: "Tidak ada aset yang diberikan." }, { status: 400 });
    }

    const rawText = await withGemini(effectiveKeys, async (client, activeModel) => {
      const mediaPart = fileUri
        ? { fileData: { fileUri, mimeType: mimeType || "video/mp4" } }
        : { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } };
      const response = await client.models.generateContent({
        model: activeModel,
        contents: [
          mediaPart,
          { text: buildPrompt(platform || "adobe", assetType || "photo", keyword || "") },
        ],
      });
      return response.text;
    }, buildModelChain(model || "gemini-3.8-flash"));

    const parsed = JSON.parse(extractJson(rawText ?? ""));
    return NextResponse.json(sanitizeSeo(parsed, platformLimits[platform] ?? platformLimits.adobe));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
