import { NextResponse } from "next/server";
import { withGemini, buildModelChain } from "@/lib/gemini";

const PROMPT = `Kamu adalah analis visual microstock profesional. Analisis gambar ini secara detail dan kembalikan HANYA objek JSON valid tanpa teks lain di luar JSON:

{
  "composition": "<komposisi: rule of thirds / simetri / leading lines / negative space / centered / dll>",
  "lighting": "<pencahayaan: tipe (natural/studio/golden hour/backlight/rim), arah, kualitas (soft/hard/diffused)>",
  "palette": ["<hex warna dominan 1>", "<hex 2>", "<hex 3>", "<hex 4>", "<hex 5>"],
  "mood": "<nuansa: warm, dramatic, minimalist, vibrant, melancholic, energetic, dll>",
  "lensEffect": "<depth of field, estimasi focal length, bokeh, wide angle distortion, dll>",
  "era": "<era gaya: Modern Contemporary / Retro Vintage / Futuristic / Classic / Editorial>",
  "stylePrompt": "<prompt dalam bahasa Inggris untuk AI image generator agar bisa mereplikasi gaya visual ini, 1-2 kalimat padat>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>", "<tag7>", "<tag8>"]
}`;

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\{[\s\S]*\}/)?.[0] ?? text.trim();
}

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, imageUrl, model, keys } = await req.json();

    if (!keys?.length) {
      return NextResponse.json({ error: "Belum ada API key. Tambahkan di halaman Settings." }, { status: 400 });
    }

    const rawText = await withGemini(keys, async (client, activeModel) => {
      let imagePart: { inlineData: { mimeType: string; data: string } };

      if (imageBase64) {
        imagePart = { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } };
      } else if (imageUrl) {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("Gagal mengambil gambar dari URL");
        const buf = await res.arrayBuffer();
        const ct = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
        imagePart = { inlineData: { mimeType: ct, data: Buffer.from(buf).toString("base64") } };
      } else {
        throw new Error("Tidak ada gambar yang diberikan");
      }

      const response = await client.models.generateContent({
        model: activeModel,
        contents: [imagePart, { text: PROMPT }],
      });
      return response.text;
    }, buildModelChain(model || "gemini-3.8-flash"));

    return NextResponse.json(JSON.parse(extractJson(rawText ?? "")));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
