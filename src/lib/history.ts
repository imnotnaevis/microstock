const MAX = 50;

export type PromptSession = {
  id: string;
  createdAt: string;
  keyword: string;
  assetType: string;
  targetModel: string;
  themes: string;
  style: string;
  prompts: { text: string; negative: string; aspectRatio: string }[];
};

export type SeoEntry = { fileName: string; result: { title: string; description: string; keywords: string[] } };

export type SeoSession = {
  id: string;
  createdAt: string;
  platform: string;
  assetType: string;
  keyword: string;
  items: SeoEntry[];
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function persist<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items.slice(0, MAX)));
}

export function savePromptSession(data: Omit<PromptSession, "id" | "createdAt">) {
  const items = load<PromptSession>("history_prompt");
  items.unshift({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  persist("history_prompt", items);
}

export function loadPromptHistory(): PromptSession[] {
  return load("history_prompt");
}

export function clearPromptHistory() {
  localStorage.removeItem("history_prompt");
}

export function saveSeoSession(data: Omit<SeoSession, "id" | "createdAt">) {
  const items = load<SeoSession>("history_seo");
  items.unshift({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  persist("history_seo", items);
}

export function loadSeoHistory(): SeoSession[] {
  return load<SeoSession>("history_seo").filter((s) => Array.isArray(s.items));
}

export function clearSeoHistory() {
  localStorage.removeItem("history_seo");
}
