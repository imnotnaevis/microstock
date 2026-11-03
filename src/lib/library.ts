export type AssetStatus = "idea" | "generated" | "produced" | "uploaded";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type Asset = {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: AssetStatus;
  createdAt: string;
  hasPrompt: boolean;
  hasSeo: boolean;
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function persist<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function loadProjects(): Project[] { return load("library_projects"); }
export function loadAssets(): Asset[] { return load("library_assets"); }

export function createProject(data: Pick<Project, "name" | "description">): Project {
  const projects = loadProjects();
  const p: Project = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  persist("library_projects", [...projects, p]);
  return p;
}

export function deleteProject(id: string) {
  persist("library_projects", loadProjects().filter((p) => p.id !== id));
  persist("library_assets", loadAssets().filter((a) => a.projectId !== id));
}

export function createAsset(data: Pick<Asset, "projectId" | "title" | "type">): Asset {
  const assets = loadAssets();
  const a: Asset = { ...data, id: crypto.randomUUID(), status: "idea", hasPrompt: false, hasSeo: false, createdAt: new Date().toISOString() };
  persist("library_assets", [...assets, a]);
  return a;
}

export function updateAsset(id: string, updates: Partial<Asset>) {
  persist("library_assets", loadAssets().map((a) => a.id === id ? { ...a, ...updates } : a));
}

export function deleteAsset(id: string) {
  persist("library_assets", loadAssets().filter((a) => a.id !== id));
}
