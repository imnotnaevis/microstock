import { NextResponse } from "next/server";
import { withGemini, buildModelChain, resolveGeminiKeys } from "@/lib/gemini";

export type TrendData = {
  summary: string;
  updatedAt: string;
  stats: {
    risingCount: number;
    avgTrendScore: number;
    saturatedCount: number;
    opportunitiesCount: number;
  };
  trendChart: { month: string; score: number }[];
  categories: { name: string; score: number; growth: number }[];
  risingKeywords: {
    keyword: string;
    score: number;
    change: string;
    platform: string;
    reason: string;
  }[];
  saturatedKeywords: {
    keyword: string;
    score: number;
    change: string;
    competition: number;
    reason: string;
  }[];
};

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return brace[0];
  return text.trim();
}

export async function POST(req: Request) {
  try {
    const { keys, model, platform, assetType, region } = await req.json();
    const effectiveKeys = resolveGeminiKeys(keys);

    if (effectiveKeys.length === 0) {
      return NextResponse.json(
        { error: "Belum ada API key. Tambahkan GEMINI_API_KEY di Vercel atau di halaman Settings." },
        { status: 400 }
      );
    }

    const platformLabel: Record<string, string> = {
      all: "Adobe Stock, Shutterstock, dan Vecteezy",
      adobe: "Adobe Stock",
      shutterstock: "Shutterstock",
      vecteezy: "Vecteezy",
    };
    const typeLabel: Record<string, string> = {
      all: "foto, vector, dan video",
      photo: "foto",
      vector: "vector",
      video: "video",
    };
    const regionLabel: Record<string, string> = {
      global: "global (seluruh dunia)",
      id: "Indonesia",
      us: "Amerika Serikat",
      eu: "Eropa",
      as: "Asia",
    };

    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    });

    const prompt = `Kamu adalah analis tren microstock profesional. Hari ini tanggal ${today}.

Gunakan Google Search untuk mencari tren terkini di ${platformLabel[platform] || "Adobe Stock dan Shutterstock"} khusus untuk konten ${typeLabel[assetType] || "foto, vector, dan video"}, pasar ${regionLabel[region] || "global"}.

Cari di Google:
- "Adobe Stock trending searches ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}"
- "Shutterstock trending keywords ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}"
- "microstock best selling keywords ${new Date().getFullYear()}"
- Event/momen bulan ini yang relevan untuk konten microstock

ATURAN PENTING untuk field "keyword":
- Harus berupa frasa pencarian nyata seperti yang diketik buyer di search bar microstock
- Spesifik dan visual: "elderly woman doing yoga outdoors", "ramadan iftar family dinner", "solar panel installation worker"
- BUKAN konsep abstrak: JANGAN tulis "authentic storytelling", "diversity", "sustainability concept"
- Panjang 2-5 kata, konkret, bisa langsung dijadikan brief foto/vector/video
- Sesuaikan dengan musim/event aktual bulan ${today}

Kembalikan HANYA objek JSON valid (tanpa teks lain di luar JSON):

{
  "summary": "Ringkasan 2 kalimat kondisi tren microstock bulan ini berdasarkan data pencarian aktual",
  "updatedAt": "${today}",
  "stats": {
    "risingCount": <angka>,
    "avgTrendScore": <0-100>,
    "saturatedCount": <angka>,
    "opportunitiesCount": <angka>
  },
  "trendChart": [
    ${last6Months.map((m) => `{"month": "${m}", "score": <0-100>}`).join(",\n    ")}
  ],
  "categories": [
    {"name": "<kategori spesifik misal: Ramadan & Eid, Summer Travel, AI Technology, Remote Work>", "score": <0-100>, "growth": <persentase, bisa negatif>},
    ... (8 kategori)
  ],
  "risingKeywords": [
    {"keyword": "<frasa pencarian konkret 2-5 kata>", "score": <0-100>, "change": "<+X%>", "platform": "<Adobe|Shutterstock|Vecteezy|Semua>", "reason": "<sebab trending: event/musim/kebutuhan editorial spesifik>"},
    ... (10 keyword)
  ],
  "saturatedKeywords": [
    {"keyword": "<frasa pencarian konkret>", "score": <0-100>, "change": "<-X%>", "competition": <0-100>, "reason": "<kenapa jenuh: terlalu banyak kontributor, demand turun, dll>"},
    ... (5 keyword)
  ]
}`;

    const rawText = await withGemini(keys, async (client, activeModel) => {
      try {
        const response = await client.models.generateContent({
          model: activeModel,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }] },
        });
        return response.text;
      } catch (groundingErr) {
        console.warn(`[trend] Google Search Grounding gagal (${activeModel}), mencoba generate langsung:`, groundingErr);
        const response = await client.models.generateContent({
          model: activeModel,
          contents: prompt,
        });
        return response.text;
      }
    }, buildModelChain(model || "gemini-2.5-flash"));

    const parsed: TrendData = JSON.parse(extractJson(rawText ?? ""));
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
