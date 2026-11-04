import { NextResponse } from "next/server";
import { withGemini, buildModelChain, resolveGeminiKeys, isRateLimitError } from "@/lib/gemini";

const platformLimits: Record<string, { name: string; maxTitle: number; maxDesc: number; maxKeywords: number }> = {
  adobe:       { name: "Adobe Stock",   maxTitle: 200, maxDesc: 200, maxKeywords: 49 },
  shutterstock:{ name: "Shutterstock",  maxTitle: 100, maxDesc: 400, maxKeywords: 50 },
  vecteezy:    { name: "Vecteezy",      maxTitle: 120, maxDesc: 300, maxKeywords: 20 },
};

function buildPrompt(platformKey: string, assetType: string, keyword: string) {
  const p = platformLimits[platformKey] ?? platformLimits.adobe;
  return `Kamu adalah SEO specialist microstock profesional yang sangat mematuhi Pedoman Konten Generative AI resmi (Adobe Stock, Shutterstock, Vecteezy). Analisis gambar/aset ini dan buat metadata SEO yang siap submit.

PEDOMAN KEPATUHAN GENERATIVE AI (WAJIB DIPATUHI SECARA KETAT):
1. ATURAN ANTI-NEWSWORTHY (SANGAT PENTING - KEBIJAKAN ADOBE STOCK):
   - "Do not submit generative AI content with titles that imply an actual depiction of newsworthy events."
   - DILARANG KERAS membuat judul atau keyword yang menyiratkan bahwa gambar ini adalah dokumentasi/liputan peristiwa berita nyata, bencana alam nyata, unjuk rasa nyata, atau konferensi pers nyata.
   - HINDARI kata-kata jurnalistik: "breaking news", "actual", "live", "documentary", "photojournalism", "press conference", nama tahun/tanggal peristiwa politik/bencana riil.
   - BINGKAI SELALU SEBAGAI KONSEP KREATIF/ILUSTRATIF: gunakan kata-kata komersial seperti "concept", "lifestyle", "background", "creative representation", "symbolic", "illustration".
2. DILARANG KERAS menyertakan:
   - Nama seniman/artis (misal: Greg Rutkowski, Studio Ghibli, dll)
   - Nama orang nyata atau tokoh terkenal (politisi, selebriti)
   - Karakter fiksi berhak cipta (Disney, Marvel, Pokemon, dll)
   - Nama agensi/lembaga pemerintah (FBI, CIA, NASA, Kepolisian, dll)
   - Merek dagang pihak ketiga (Apple, Nike, Starbucks, dll)
3. Klasifikasikan tipe konten:
   - Photos: jika foto realistis menyerupai jepretan kamera dan mematuhi anatomi manusia/hewan
   - Illustrations: jika berupa seni grafis, konsep fantasi, lukisan, atau render artistik
   - Vectors: jika grafis vektor
   - Videos: jika rekaman bergerak
4. Tentukan apakah gambar menampilkan orang fiktif atau properti fiktif (fictional people/property).

Buat metadata dalam bahasa Inggris. Return HANYA objek JSON valid tanpa teks lain:

{
  "title": "<judul SEO komersial maks ${p.maxTitle} karakter, berformat konsep/lifestyle, bebas brand/nama artis, sentence case (kapital hanya di awal kalimat)>",
  "description": "<deskripsi maks ${p.maxDesc} karakter, jelas, informatif, bebas klaim berita aktual>",
  "keywords": ["<keyword1>", "<keyword2>", ...],
  "adobeStockCompliance": {
    "isAiGenerated": true,
    "hasFictionalPeopleOrProperty": <true jika menampilkan manusia/bangunan fiktif, false jika alam/objek murni>,
    "recommendedCheckboxes": [
      "Created using generative AI tools"
    ],
    "category": "<Photos | Illustrations | Vectors | Videos>",
    "antiNewsworthyVerified": true,
    "complianceNotes": "100% Bebas klaim berita aktual, merek dagang, nama tokoh, dan nama seniman. Aman untuk lisensi komersial Adobe Stock."
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

function cleanNewsworthy(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/\bbreaking\s+news\b/gi, "conceptual visual");
  cleaned = cleaned.replace(/\bphotojournalism\b/gi, "documentary style concept");
  cleaned = cleaned.replace(/\bpress\s+conference\b/gi, "media event concept");
  cleaned = cleaned.replace(/\blive\s+report(?:age)?\b/gi, "conceptual report");
  cleaned = cleaned.replace(/\bactual\s+(?:event|depiction|footage|photo)\b/gi, "fictional concept");
  cleaned = cleaned.replace(/\breal\s+(?:footage|news|event)\b/gi, "creative concept");
  return cleaned;
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
      antiNewsworthyVerified?: boolean;
      complianceNotes?: string;
    };
  },
  limits: { maxTitle: number; maxDesc: number; maxKeywords: number }
) {
  const rawTitle = cleanNewsworthy(raw.title ?? "");
  const title = toSentenceCase(rawTitle.trim().replace(/\.+$/, "")).slice(0, limits.maxTitle).trim();
  const rawDesc = cleanNewsworthy(raw.description ?? "");
  const description = rawDesc.trim().slice(0, limits.maxDesc).trim();

  const forbiddenWords = ["breaking news", "actual event", "press conference", "live report", "real event", "actual news"];
  const keywords = [...new Set((raw.keywords ?? []).map((k) => String(k).trim().toLowerCase()).filter(Boolean))]
    .filter((k) => !forbiddenWords.includes(k))
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
    antiNewsworthyVerified: true,
    complianceNotes:
      raw.adobeStockCompliance?.complianceNotes ||
      "100% Bebas klaim berita aktual (anti-newsworthy), bebas merek dagang, dan nama artis. Aman untuk Adobe Stock.",
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
    const isQuota = isRateLimitError(err);
    const message = isQuota
      ? "Batas kuota Gemini API tercapai (Rate Limit 429). Kuota permintaan per menit (RPM) telah penuh. Silakan tunggu 1-2 menit atau tambahkan API Key cadangan di menu Settings."
      : (err as Error).message;
    return NextResponse.json(
      { error: message, isQuotaExhausted: isQuota, code: isQuota ? "QUOTA_EXHAUSTED" : "SERVER_ERROR" },
      { status: isQuota ? 429 : 500 }
    );
  }
}
