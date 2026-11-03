import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Rekomendasi - Cepat & Cerdas)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Sangat Cepat & Stabil)" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite (Super Cepat & Hemat Quota)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Paling Kompatibel & Stabil)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Lebih Pintar, Lebih Lambat)" },
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Preview)" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (Preview)" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["value"];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function isRateLimitError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted")
  );
}

function isTransientServerError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("service unavailable") ||
    msg.includes("500") ||
    msg.includes("internal server error")
  );
}

function isModelUnavailableError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("not_found") ||
    msg.includes("no longer available") ||
    msg.includes("is not supported") ||
    isTransientServerError(err)
  );
}

// Uploaded file reports ACTIVE but Gemini's backend hasn't replicated it yet.
function isFileNotReadyError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return msg.includes("permission_denied") && msg.includes("may not exist");
}

async function callWithRetry<T>(
  client: GoogleGenAI,
  model: string,
  fn: (client: GoogleGenAI, model: string) => Promise<T>
): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(client, model);
    } catch (err) {
      // 1. Files API replication delay
      if (isFileNotReadyError(err) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      // 2. Transient server error (503 high demand spike / overloaded)
      // Google: "Spikes in demand are usually temporary. Please try again later."
      if (isTransientServerError(err) && attempt < maxAttempts) {
        // Exponential backoff: 3s, 6s, 9s
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      throw err;
    }
  }
  throw new Error("Maksimum percobaan retry terlampaui.");
}

// fn receives (client, model) so model rotation is transparent to callers
export async function withGemini<T>(
  keys: string[],
  fn: (client: GoogleGenAI, model: string) => Promise<T>,
  models: string[]
): Promise<T> {
  if (keys.length === 0) {
    throw new Error("Tidak ada API key yang dikonfigurasi. Tambahkan di halaman Settings.");
  }

  let lastError: unknown;

  for (const model of models) {
    let modelUnavailable = false;

    for (const key of keys) {
      try {
        const client = new GoogleGenAI({ apiKey: key });
        return await callWithRetry(client, model, fn);
      } catch (err) {
        console.error(`[withGemini] Gagal pada model "${model}":`, getErrorMessage(err));
        lastError = err;

        if (isRateLimitError(err)) {
          continue; // coba API key berikutnya
        }
        if (isModelUnavailableError(err)) {
          modelUnavailable = true;
          break; // skip sisa key untuk model ini, coba model berikutnya
        }
        // Jika error lain (misal quota search atau permission), coba model lain juga
        modelUnavailable = true;
        break;
      }
    }

    if (!modelUnavailable && lastError) {
      lastError = new Error(`Model ${model} kena batas limit: ${getErrorMessage(lastError)}`);
    }
  }

  const errorMsg = (lastError as Error)?.message || getErrorMessage(lastError);
  throw new Error(`Semua model tidak tersedia: ${errorMsg}`);
}

// Build fallback model chain: user's choice first, then other known-good models as fallback
export function buildModelChain(primary: string): string[] {
  const fallbacks = [
    primary,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
  ];
  return [...new Set(fallbacks.filter(Boolean))];
}
