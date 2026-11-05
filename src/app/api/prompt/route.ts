import { NextResponse } from "next/server";
import { withGemini, buildModelChain, resolveGeminiKeys, isRateLimitError } from "@/lib/gemini";

const MODEL_TIPS: Record<string, string> = {
  flux: "Format FLUX.1: deskripsi photorealistic presisi tinggi bahasa Inggris, fokus pada tekstur material autentik (kayu, marmer, kaca, logam, air, kain), pencahayaan komersial f/8 seimbang tanpa blown-out highlights, komposisi still life/environment bersih, tanpa efek cat air.",
  nanobanana: "Format Nano Banana: deskripsi visual yang sangat padat, tajam, dan fokus dalam bahasa Inggris untuk aset microstock komersial berkualitas tinggi lolos kurasi Adobe Stock. Urutkan elemen: [subjek utama tajam dengan tekstur mikro autentik], [pencahayaan komersial seimbang tanpa blown-out highlights & sudut kamera f/8], [lingkungan/background bersih berdefinisi tinggi], [palet warna natural & mood komersial], [razor-sharp focus, professional stock photography, 8k]. Pisahkan setiap elemen dengan koma.",
  midjourney: "Format Midjourney: deskripsi detail, pisahkan elemen dengan koma, sertakan cues ketajaman komersial (tack-sharp focus, f/8 aperture, authentic micro-textures, clean balanced lighting), tambahkan parameter seperti --ar 16:9 --v 6.1 --style raw di akhir.",
  firefly: "Format Adobe Firefly: kalimat deskriptif natural, spesifik tentang subjek tajam, pencahayaan studio/alami seimbang tanpa overexposure, tekstur realistis autentik, dan komposisi komersial rapi.",
  sdxl: "Format Stable Diffusion XL: keyword padat dipisah koma, tambahkan quality tags seperti (tack sharp focus:1.2), (hyperdetailed:1.1), (f/8 aperture:1.1), (masterpiece:1.2), (best quality:1.1).",
  dalle3: "Format DALL-E 3: kalimat natural deskriptif, spesifik dan detail tentang ketajaman fokus dan pencahayaan komersial, hindari efek kartun/plastik.",
  ideogram: "Format Ideogram: deskripsi natural, fokus pada ketajaman dan tekstur realistis, bisa include teks jika ada elemen tipografi.",
  veo: "Format Google Veo: deskripsi sinematik, sertakan gerakan kamera stabil, pencahayaan tajam, pacing, color grade, shot type.",
  runway: "Format Runway Gen-3: deskripsikan pergerakan halus, ketajaman visual, dan transisi secara sinematik.",
  pika: "Format Pika Labs: deskripsi pendek dan padat, fokus pada subjek tajam dan motion stabil.",
  sora: "Format Sora: kalimat sinematik natural, deskripsikan adegan tajam, pencahayaan seimbang, dan gerakan.",
  kling: "Format Kling AI: deskripsi natural, sertakan elemen temporal, ketajaman, dan gerakan stabil.",
};

export const MARKET_ASPECT_RATIO_INFO: Record<
  string,
  { label: string; useCase: string; demand: string; badge: string }
> = {
  "16:9": {
    label: "16:9 (Landscape Widescreen)",
    useCase: "Website Hero Banner, YouTube Thumbnails, Digital Ads, Presentasi Bisnis",
    demand: "Sangat Tinggi",
    badge: "🔥 Paling Laku untuk Web & Media",
  },
  "9:16": {
    label: "9:16 (Vertical Fullscreen)",
    useCase: "TikTok, Instagram Reels, YouTube Shorts, Story, Mobile Lockscreen",
    demand: "Sangat Tinggi",
    badge: "🔥 Meledak untuk Mobile & Video",
  },
  "3:2": {
    label: "3:2 (Standar 35mm Photo)",
    useCase: "Fotografi komersial Shutterstock/Adobe Stock, editorial, majalah, kemasan",
    demand: "Tinggi",
    badge: "⭐ Standar Stock Photography",
  },
  "2:3": {
    label: "2:3 (Portrait Poster)",
    useCase: "Poster, cover buku/e-book, flyer vertikal, katalog fashion",
    demand: "Tinggi",
    badge: "⭐ Populer untuk Poster & Cetak",
  },
  "1:1": {
    label: "1:1 (Square Persegi)",
    useCase: "Icon Set, Instagram Feed, Marketplace Thumbnail (Tokopedia/Shopee), Avatar",
    demand: "Tinggi",
    badge: "⭐ Utama untuk Icon & E-Commerce",
  },
  "4:3": {
    label: "4:3 (Landscape Medium)",
    useCase: "E-Commerce product card, tablet display, editorial print",
    demand: "Menengah",
    badge: "Standar Display & E-Commerce",
  },
  "3:4": {
    label: "3:4 (Portrait Medium)",
    useCase: "Pinterest pins, visual feed mobile, majalah cetak",
    demand: "Menengah",
    badge: "Populer di Pinterest & Media Cetak",
  },
};

export const ASPECT_RATIOS: Record<string, string[]> = {
  image: ["16:9", "4:3", "1:1", "3:2", "9:16"],
  photo: ["3:2", "4:3", "16:9", "1:1", "2:3"],
  vector: ["1:1", "16:9", "4:3", "3:4"],
  video: ["16:9", "9:16", "1:1"],
};

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\[[\s\S]*\]/)?.[0] ?? text.trim();
}

function enrichNegativePrompt(existingNegative: string, noPeople: boolean = false): string {
  const coreNegatives = [
    "soft focus",
    "out of focus",
    "blurry",
    "motion blur",
    "oversharpened",
    "plastic skin",
    "doll-like",
    "smooth airbrushed skin",
    "watercolor look",
    "washed out colors",
    "overexposed highlights",
    "blown-out whites",
    "underexposed crushed shadows",
    "chromatic aberration",
    "digital noise",
    "grain",
    "compression artifacts",
    "jpeg artifacts",
    "bad anatomy",
    "deformed hands",
    "extra fingers",
    "missing fingers",
    "mutated limbs",
    "malformed body",
    "asymmetrical eyes",
    "double irises",
    "text",
    "watermark",
    "signature",
    "logo",
    "low resolution",
  ];

  if (noPeople) {
    coreNegatives.push(
      "person",
      "human",
      "people",
      "man",
      "woman",
      "child",
      "crowd",
      "face",
      "hands",
      "fingers",
      "skin",
      "silhouette",
      "portrait",
      "body parts"
    );
  }

  const existingParts = (existingNegative || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const set = new Set<string>();
  for (const part of existingParts) {
    set.add(part.toLowerCase());
  }
  for (const core of coreNegatives) {
    set.add(core);
  }

  return Array.from(set).join(", ");
}

export async function POST(req: Request) {
  try {
    const {
      keyword,
      themes,
      style,
      brief,
      assetType,
      targetModel,
      count,
      model,
      keys,
      seamless,
      abstrak,
      iconSet,
      noPeople,
      selectedRatio,
    } = await req.json();
    const effectiveKeys = resolveGeminiKeys(keys);

    if (!effectiveKeys.length) {
      return NextResponse.json(
        { error: "Belum ada API key. Tambahkan GEMINI_API_KEY di Vercel atau halaman Settings." },
        { status: 400 }
      );
    }

    if (!targetModel) {
      return NextResponse.json({ error: "Target Model AI wajib dipilih." }, { status: 400 });
    }

    const n = Math.min(Math.max(parseInt(count) || 3, 1), 20);
    const validRatios = ASPECT_RATIOS[assetType] || ASPECT_RATIOS.image;
    const enforcedRatio =
      selectedRatio && selectedRatio !== "auto" && validRatios.includes(selectedRatio)
        ? selectedRatio
        : null;
    const modelTip = MODEL_TIPS[targetModel] || "Format deskriptif detail.";

    const isVideoMode = seamless || abstrak;

    if (iconSet) {
      const iconSetPrompt = `You are a professional prompt engineer for microstock icon assets. Generate EXACTLY ${n} different icon set prompts for the ${targetModel || "image AI"} AI model.

ICON SET COMPOSITION — NON-NEGOTIABLE RULES:
- Each prompt MUST produce ONE single image containing EXACTLY 12 icons — no more, no less, never 11 or 13
- Grid layout: 4 columns × 3 rows, perfectly aligned with equal spacing between every icon
- Canvas background: pure solid white (#FFFFFF) — absolutely no gradients, textures, patterns, or tinted backgrounds
- All 12 icons must be uniform in size, visual weight, and consistent in style with each other
- Icons must be clearly separated with generous padding — no overlapping, no clipping at edges
- Clean, commercially viable flat design — no heavy drop shadows, no 3D extrusion, no photorealistic rendering
- The overall image must look like a professional icon set collection sheet sold on microstock platforms
- ABSOLUTELY NO TEXT, letters, numbers, labels, captions, watermarks, or any typography anywhere in the image — pure graphic icons only, zero text elements
- Icon theme/category: ${keyword}
${themes ? `- Additional style/theme: ${themes}` : ""}
${style ? `- Style preset: ${style}` : ""}
${brief ? `- Additional brief: ${brief}` : ""}

FORMAT GUIDE: ${modelTip}

DIVERSIFICATION ACROSS PROMPTS:
- Each of the ${n} prompts must feature a DIFFERENT set of 12 icon subjects within the "${keyword}" category
- Vary icon style across prompts: flat color, outline/line art, filled monochrome, duotone, minimal, etc.
- Never repeat the same icon collection across prompts

NEGATIVE PROMPT (mandatory for all): photorealistic, 3D render, photo, gradient background, colored background, texture background, drop shadow, perspective distortion, cropped icons, overlapping icons, fewer than 12 icons, more than 12 icons, blurry, low quality, text, letters, numbers, labels, captions, watermarks, typography, words, characters, alphabet

Aspect ratio for all icon sets: 1:1 (square canvas)

Return ONLY a valid JSON array with EXACTLY ${n} items, no other text:
[{ "text": "<complete ready-to-use prompt specifying exactly 12 icons on white background in 4x3 grid>", "negative": "photorealistic, 3D render, photo, gradient background, colored background, texture background, drop shadow, perspective distortion, cropped icons, overlapping icons, fewer than 12 icons, more than 12 icons, blurry, low quality, text, letters, numbers, labels, captions, watermarks, typography, words, characters, alphabet", "aspectRatio": "1:1", "aspectRatioReason": "Standar grid 1:1 wajib untuk koleksi icon set microstock (mudah dipotong dan dikonversi ke SVG/vektor)" }]`;

      const rawText = await withGemini(
        effectiveKeys,
        async (client, activeModel) => {
          const response = await client.models.generateContent({
            model: activeModel,
            contents: iconSetPrompt,
          });
          return response.text;
        },
        buildModelChain(model || "gemini-3.8-flash")
      );

      const parsed = JSON.parse(extractJson(rawText ?? ""));
      if (!Array.isArray(parsed)) throw new Error("Format respons tidak valid");

      return NextResponse.json(
        parsed.slice(0, n).map(
          (
            p: {
              text: string;
              negative: string;
              aspectRatio?: string;
              aspectRatioReason?: string;
            },
            i: number
          ) => ({
            id: String(i + 1),
            text: p.text,
            negative: enrichNegativePrompt(p.negative, Boolean(noPeople)),
            aspectRatio: "1:1",
            aspectRatioReason:
              p.aspectRatioReason ||
              "Standar grid 1:1 wajib untuk koleksi icon set microstock (mudah dipotong dan dikonversi ke SVG/vektor)",
          })
        )
      );
    }

    const seamlessRules = seamless
      ? `
SEAMLESS LOOP — WAJIB:
- Video harus looping sempurna: frame pertama identik dengan frame terakhir
- Gerakan harus kontinu dan tidak putus: aliran air, gelombang, partikel berputar, gradien bergerak, texture flowing
- TIDAK boleh ada hard cut, jump cut, atau transisi yang terlihat
- Durasi ideal: 4-10 detik yang bisa di-loop tanpa terasa
- Teknik: seamless loop, perfect loop, cinemagraph style, infinite loop`
      : "";

    const abstrakRules = abstrak
      ? `
ABSTRACT VISUAL — WAJIB:
- TIDAK boleh ada objek/subjek yang dapat dikenali (no people, no objects, no text, no landscapes)
- Murni elemen visual: warna, cahaya, bentuk geometris, fluid simulation, partikel, bokeh, tekstur organik, motion graphics, plasma
- Contoh: color gradient flow, geometric morphing, light leak explosion, particle wave, ink in water, glitch art, fractal zoom`
      : "";

    const videoRatioRules = enforcedRatio
      ? `- WAJIB gunakan aspect ratio TEPAT "${enforcedRatio}" untuk semua prompt.
- Berikan "aspectRatioReason" singkat dalam bahasa Indonesia mengapa rasio ini cocok untuk video komersial.`
      : `- Tentukan aspect ratio paling laku dan bernilai komersial dari pilihan: [${validRatios.join(", ")}]. (Catatan pasar: 9:16 untuk Reels/TikTok/Shorts dengan demand meledak, 16:9 untuk YouTube & Video Web).
- Berikan "aspectRatioReason" singkat dalam bahasa Indonesia mengapa rasio ini direkomendasikan untuk video tersebut.`;

    const imageRatioRules = enforcedRatio
      ? `- WAJIB gunakan aspect ratio TEPAT "${enforcedRatio}" untuk semua prompt.
- Berikan "aspectRatioReason" singkat dalam bahasa Indonesia mengapa rasio ini cocok untuk aset tersebut.`
      : `- Tentukan aspect ratio paling laku dan komersial dari pilihan: [${validRatios.join(", ")}].
- Berikan "aspectRatioReason" singkat dalam bahasa Indonesia mengapa rasio ini direkomendasikan (mis: "Paling dicari untuk Website Hero Banner & Display Ads" atau "Standar fotografi komersial Shutterstock/Adobe Stock" atau "Populer untuk Poster & Cover Cetak").`;

    const adobeComplianceRules = `
PEDOMAN KEPATUHAN & STANDAR KUALITAS TEKNIS ADOBE STOCK (ANTI-REJECTION RULES):
1. ATURAN KUALITAS TEKNIS (MENCEGAH PENOLAKAN "QUALITY & TECHNICAL ISSUES"):
   - Penolakan paling umum kurator Adobe Stock adalah: "Exposure issues, soft focus, excessive filtering or artifacts/noise".
   - Wajib instruksikan gambar dengan:
     * KETAJAMAN TINGGI (Razor-sharp focus, tack-sharp focal details, f/8 aperture depth of field).
     * TEKSTUR REALISTIS (Authentic micro-textures, natural skin pores, realistic fabric/surface detail — HINDARI kulit plastik atau efek cat air).
     * PENCAHAYAAN SEIMBANG (Balanced commercial dynamic range — TIDAK overexposed putih silau, TIDAK underexposed hitam pekat).
   - Negative prompt WAJIB sangat lengkap menyertakan penangkal penolakan teknis Adobe Stock.
2. DILARANG KERAS menyertakan:
   - Nama artis/seniman (misal: Greg Rutkowski, Artgerm, dll)
   - Nama orang nyata atau tokoh terkenal (politisi, selebriti, dll)
   - Karakter fiksi berhak cipta (Disney, Marvel, Anime terkenal, dll)
   - Nama agensi/lembaga pemerintah (FBI, CIA, NASA, Kepolisian, dll)
   - Merek dagang / logo / properti intelektual pihak ketiga (Apple, Nike, dll)
   - Narasi yang mengklaim peristiwa berita aktual/nyata (editorial news deception)
3. KUALITAS ANATOMI & DETAIL:
   - Anatomi manusia dan hewan harus sempurna secara biologis: tangan 5 jari yang rapi, mata simetris, pupil bulat tunggal, proporsi tubuh alami, tanpa mutasi.
4. ANTI-SPAM (KEUNIKAN KOLEKSI):
   - Jangan buat variasi yang hampir identik dari satu prompt yang sama (kebijakan anti-spam Adobe Stock).
   - Setiap prompt dari ${n} variasi ini HARUS memiliki komposisi, subjek unik, angle kamera, dan suasana yang berbeda secara nyata.`;

    const noPeopleRules = noPeople
      ? `
ATURAN BEBAS UNSUR MANUSIA (ZERO HUMANS / NON-HUMAN FOCUS):
- DILARANG KERAS menyertakan orang, manusia, wajah, siluet, tangan, jari, kulit, atau bagian tubuh manusia mana pun.
- Fokus 100% pada benda mati, alam/botanikal, arsitektur interior kosong tanpa orang, mockup produk, makanan/minuman, tekstur, atau 3D abstract object.
- Gambar harus sepenuhnya bebas dari kebutuhan Model Release.`
      : "";

    const prompt = isVideoMode
      ? `Kamu adalah ahli prompt engineering untuk video microstock. Buat TEPAT ${n} variasi prompt video untuk model AI ${targetModel || "video AI"}.
${seamlessRules}${abstrakRules}${noPeopleRules}

Panduan format: ${modelTip}
${themes ? `\nStyle/tema tambahan: ${themes}` : ""}${style ? `\nStyle preset: ${style}` : ""}${brief ? `\nBrief: ${brief}` : ""}
${adobeComplianceRules}

ATURAN ASPEK RASIO PASAR:
${videoRatioRules}

ATURAN DIVERSIFIKASI:
- Setiap prompt HARUS memiliki palet warna, ritme gerakan, dan elemen visual yang BERBEDA
- Tujuan: ${n} aset berbeda yang bisa dijual independen
- Negative prompt: no people, no text, no recognizable objects, no camera shake, bad quality${abstrak ? "" : ", no abrupt cuts"}

Kembalikan HANYA array JSON valid dengan TEPAT ${n} item:
[{ "text": "<prompt>", "negative": "<negative>", "aspectRatio": "<ratio>", "aspectRatioReason": "<alasan kebutuhan pasar komersial>" }]`
      : `Kamu adalah ahli prompt engineering untuk aset microstock. Buat TEPAT ${n} variasi prompt untuk model AI ${targetModel || "image AI"}.

Input:
- Tipe aset: ${assetType}
- Kategori: ${keyword}
- Tema/style tambahan: ${themes || "-"}
- Style preset: ${style || "-"}
- Brief: ${brief || "-"}

Panduan format: ${modelTip}
${adobeComplianceRules}${noPeopleRules}

ATURAN ASPEK RASIO PASAR:
${imageRatioRules}

ATURAN WAJIB — DIVERSIFIKASI:
- Setiap prompt HARUS memiliki SUBJEK yang BERBEDA dalam kategori "${keyword}". Jangan ulangi objek/subjek yang sama.
- Variasikan sudut kamera: top-down, eye-level, low angle, close-up macro, wide shot, aerial — tiap prompt berbeda.
- Variasikan environment/konteks: indoor, outdoor, studio, alam, urban, dll.
- Variasikan lighting: golden hour, studio softbox, natural window light, dramatic side light, dll.
- Tujuan: ${n} prompt = ${n} aset berbeda yang bisa dijual secara independen, bukan variasi dari objek yang sama.
- Fokus nilai komersial microstock: clean, versatile, commercially usable.
- Negative prompt relevan per subjek masing-masing.

Kembalikan HANYA array JSON valid dengan TEPAT ${n} item, tanpa teks lain:
[{ "text": "<prompt lengkap siap pakai>", "negative": "<negative prompt>", "aspectRatio": "<salah satu dari: ${validRatios.join(", ")}>", "aspectRatioReason": "<alasan kebutuhan pasar komersial>" }]`;

    const rawText = await withGemini(
      effectiveKeys,
      async (client, activeModel) => {
        const response = await client.models.generateContent({
          model: activeModel,
          contents: prompt,
        });
        return response.text;
      },
      buildModelChain(model || "gemini-3.8-flash")
    );

    const parsed = JSON.parse(extractJson(rawText ?? ""));
    if (!Array.isArray(parsed)) throw new Error("Format respons tidak valid");

    const results = parsed.slice(0, n).map(
      (
        p: {
          text: string;
          negative: string;
          aspectRatio?: string;
          aspectRatioReason?: string;
        },
        i: number
      ) => {
        const finalRatio = p.aspectRatio || enforcedRatio || validRatios[0];
        const marketInfo = MARKET_ASPECT_RATIO_INFO[finalRatio];
        const fallbackReason = marketInfo
          ? `${marketInfo.badge} — ${marketInfo.useCase}`
          : "Format komersial standar microstock";

        return {
          id: String(i + 1),
          text: p.text,
          negative: enrichNegativePrompt(p.negative, Boolean(noPeople)),
          aspectRatio: finalRatio,
          aspectRatioReason: p.aspectRatioReason?.trim() || fallbackReason,
        };
      }
    );

    return NextResponse.json(results);
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
