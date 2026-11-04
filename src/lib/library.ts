export type AssetStatus =
  | "in_review"
  | "accepted"
  | "rejected"
  | "draft"
  | "idea"
  | "generated"
  | "produced"
  | "uploaded";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type Asset = {
  id: string;
  projectId?: string;
  title: string;
  type: string;
  category?: string;
  status: AssetStatus;
  rejectionReason?: string;
  thumbnail?: string;
  createdAt: string;
  hasPrompt: boolean;
  hasSeo: boolean;
  seoData?: {
    title: string;
    description: string;
    keywords: string[];
  };
  adobeStockCompliance?: {
    category?: string;
    recommendedCheckboxes?: string[];
    complianceNotes?: string;
  };
};

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function persist<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("Gagal menyimpan ke localStorage:", err);
  }
}

export function loadProjects(): Project[] {
  return load("library_projects");
}

export function loadAssets(): Asset[] {
  return load("library_assets");
}

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
  const a: Asset = {
    ...data,
    id: crypto.randomUUID(),
    status: "in_review",
    category: "Photos",
    hasPrompt: false,
    hasSeo: false,
    createdAt: new Date().toISOString(),
  };
  persist("library_assets", [a, ...assets]);
  return a;
}

export function saveOrUpdateSeoAsset(data: {
  title: string;
  type: string;
  category?: string;
  thumbnail?: string;
  status?: AssetStatus;
  projectId?: string;
  seoData?: { title: string; description: string; keywords: string[] };
  adobeStockCompliance?: { category?: string; recommendedCheckboxes?: string[]; complianceNotes?: string };
}): Asset {
  const assets = loadAssets();
  const a: Asset = {
    id: crypto.randomUUID(),
    title: data.title || "Untitled Asset",
    type: data.type || "photo",
    category: data.category || "Photos",
    status: data.status || "in_review",
    thumbnail: data.thumbnail || "",
    projectId: data.projectId,
    hasPrompt: false,
    hasSeo: true,
    seoData: data.seoData,
    adobeStockCompliance: data.adobeStockCompliance,
    createdAt: new Date().toISOString(),
  };
  // Prepend to top of assets list
  persist("library_assets", [a, ...assets]);
  return a;
}

export function updateAsset(id: string, updates: Partial<Asset>) {
  persist(
    "library_assets",
    loadAssets().map((a) => (a.id === id ? { ...a, ...updates } : a))
  );
}

export function deleteAsset(id: string) {
  persist(
    "library_assets",
    loadAssets().filter((a) => a.id !== id)
  );
}

// Lightweight thumbnail generator using HTML5 Canvas to keep localStorage usage small (<10KB per image)
export function createThumbnail(fileOrDataUrl: File | string, maxWidth = 160, maxHeight = 160): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }
    const img = document.createElement("img");
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width || 1;
        let height = img.height || 1;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl.slice(0, 50000) : "");
        }
      } catch {
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl.slice(0, 50000) : "");
      }
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl.slice(0, 50000) : "");
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
