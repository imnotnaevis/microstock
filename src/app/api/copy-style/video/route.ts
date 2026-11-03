import { NextResponse } from "next/server";
import { withGemini, buildModelChain } from "@/lib/gemini";

const PROMPT =`Kamu adalah analis visual microstock profesional. Analisis video/konten ini secara detail dan kembalikan HANYA objek JSON valid tanpa teks lain di luar JSON:

{
  "pacing": "<kecepatan edit: slow & cinematic / medium paced / fast cut, estimasi fps>",
  "cameraMovement": "<gerakan kamera: slow pan / handheld shake / static / dolly / aerial / rack focus / dll>",
  "colorGrading": "<color grade: teal & orange / warm golden / cold blue / desaturated / natural / dll, LUT style>",
  "lighting": "<pencahayaan: dramatic side / soft diffused / natural outdoor / practical lights / dll>",
  "mood": "<suasana: cinematic, energetic, melancholic, uplifting, mysterious, commercial, dll>",
  "shotTypes": ["<tipe shot 1>", "<tipe shot 2>", "<tipe shot 3>", "<tipe shot 4>"],
  "aspectRatio": "<aspect ratio: 16:9 / 9:16 vertical / 2.39:1 cinematic / 1:1 square>",
  "duration": "<estimasi durasi ideal untuk microstock: 10s / 15s / 30s / 60s>",
  "stylePrompt": "<prompt dalam bahasa Inggris untuk AI video generator agar bisa mereplikasi gaya sinematik ini, 1-2 kalimat padat>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>", "<tag7>", "<tag8>"]
}`;

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\{[\s\S]*\}/)?.[0] ?? text.trim();
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fileUri: string = body.fileUri || "";
    const videoUrl: string = body.videoUrl || "";
    const mimeType: string = body.mimeType || "video/mp4";
    const model: string = body.model || "";
    const keys: string[] = body.keys || [];

    if (!keys.length) {
      return NextResponse.json({ error: "Belum ada API key. Tambahkan di halaman Settings." }, { status: 400 });
    }

    const rawText = await withGemini(keys, async (client, activeModel) => {
      let videoPart: { inlineData?: { mimeType: string; data: string }; fileData?: { fileUri: string; mimeType?: string } };

      if (fileUri) {
        videoPart = { fileData: { fileUri, mimeType } };
      } else if (isYouTubeUrl(videoUrl)) {
        videoPart = { fileData: { fileUri: videoUrl } };
      } else {
        const res = await fetch(videoUrl);
        if (!res.ok) throw new Error("Gagal mengambil video dari URL");
        const buf = await res.arrayBuffer();
        const ct = (res.headers.get("content-type") || "video/mp4").split(";")[0];
        videoPart = { inlineData: { mimeType: ct, data: Buffer.from(buf).toString("base64") } };
      }

      const response = await client.models.generateContent({
        model: activeModel,
        contents: [videoPart, { text: PROMPT }],
      });
      return response.text;
    }, buildModelChain(model || "gemini-3.8-flash"));

    return NextResponse.json(JSON.parse(extractJson(rawText ?? "")));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
