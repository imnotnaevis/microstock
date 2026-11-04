export type DayOfWeek = "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu" | "minggu";

export type DailyTask = {
  id: string;
  day: DayOfWeek;
  dayName: string;
  dayOrder: number;
  phase: string;
  title: string;
  category: string;
  targetKeyword: string;
  actionItems: string[];
  targetOutput: string;
  completed: boolean;
  completedAt?: string;
  actionUrl: string;
  actionLabel: string;
  isExternalLink?: boolean;
  tips: string;
};

export type WeeklyPlan = {
  weekId: string;
  weekRangeLabel: string;
  mainTheme: string;
  category: string;
  weeklyGoal: string;
  tasks: DailyTask[];
  updatedAt: string;
};

// Return ISO Week ID (e.g. "2026-W45")
export function getCurrentWeekId(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Return human-readable range (e.g. "4 Nov - 10 Nov 2026")
export function getCurrentWeekRange(d = new Date()): { start: Date; end: Date; label: string } {
  const now = new Date(d);
  const day = now.getDay();
  // Monday is 1, Sunday is 0
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatShort = (date: Date) =>
    date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const formatYear = sunday.getFullYear();

  return {
    start: monday,
    end: sunday,
    label: `${formatShort(monday)} - ${formatShort(sunday)} ${formatYear}`,
  };
}

// Get day of week index for today (0 for Monday, 6 for Sunday)
export function getTodayDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export function getTodayDayName(): string {
  const names = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  return names[getTodayDayIndex()];
}

// Extract active trend keywords from localStorage
function getActiveTrendContext(): { keyword: string; category: string; secondaryKeyword: string } {
  if (typeof window === "undefined") {
    return {
      keyword: "Ramadan Kareem Family Gathering",
      category: "Kultur & Perayaan Musiman",
      secondaryKeyword: "Artificial Intelligence Corporate Workflow",
    };
  }

  try {
    const raw = localStorage.getItem("microstock_cached_trend");
    if (raw) {
      const parsed = JSON.parse(raw);
      const data = parsed?.data;
      if (data?.risingKeywords && data.risingKeywords.length > 0) {
        const primary = data.risingKeywords[0];
        const secondary = data.risingKeywords[1] || data.risingKeywords[0];
        const category =
          data.topCategories?.[0]?.category ||
          (primary.platform ? `${primary.platform} Trending` : "Tren Utama");
        return {
          keyword: primary.keyword || "Ramadan Kareem Family Gathering",
          category,
          secondaryKeyword: secondary.keyword || "AI Tech Workspace",
        };
      }
    }
  } catch {}

  return {
    keyword: "Ramadan Kareem Family Gathering",
    category: "Kultur & Perayaan Musiman",
    secondaryKeyword: "Modern Eco Sustainable Workspace",
  };
}

export function generateDefaultWeeklyPlan(weekId?: string): WeeklyPlan {
  const targetWeekId = weekId || getCurrentWeekId();
  const range = getCurrentWeekRange();
  const trend = getActiveTrendContext();

  const kwEnc = encodeURIComponent(trend.keyword);
  const kw2Enc = encodeURIComponent(trend.secondaryKeyword);

  const tasks: DailyTask[] = [
    {
      id: `${targetWeekId}-senin`,
      day: "senin",
      dayName: "Senin",
      dayOrder: 1,
      phase: "1. Riset & Konsep",
      title: "Riset Tren Utama & Pemetaan 1 Tema Komersial",
      category: trend.category,
      targetKeyword: trend.keyword,
      actionItems: [
        `Buka Dasbor Tren dan pelajari keyword tren teratas: "${trend.keyword}".`,
        `Identifikasi kebutuhan pembeli: Siapa target konsumennya? (misal: Digital Agency, Website Hero, E-Commerce Campaign).`,
        `Tentukan angle visual: Suasana emosional, pencahayaan alami (golden hour/softbox), dan komposisi tanpa distraksi.`,
      ],
      targetOutput: "1 Tema Utama Terpilih & 3 Catatan Kebutuhan Pembeli",
      completed: false,
      actionUrl: `/dashboard`,
      actionLabel: "Buka Dasbor Tren",
      isExternalLink: false,
      tips: "Fokus pada tema musiman 1-2 bulan sebelum momen puncak agar portofolio Anda sudah terindeks di mesin pencari microstock.",
    },
    {
      id: `${targetWeekId}-selasa`,
      day: "selasa",
      dayName: "Selasa",
      dayOrder: 2,
      phase: "2. Prompt Engineering",
      title: "Generate 5-10 Prompt Siap Pakai di Model AI (Nano Banana)",
      category: trend.category,
      targetKeyword: trend.keyword,
      actionItems: [
        `Buka Generator Prompt dengan keyword otomatis "${trend.keyword}".`,
        `Pilih Target Model AI (🍌 Nano Banana) dengan 1-klik chip.`,
        `Tentukan aspek rasio komersial pasar: 16:9 untuk Website Hero Banner atau 3:2 untuk Standar Stock Photography.`,
        `Generate minimal 5 variasi prompt dengan variasi sudut kamera (Eye-level, Top-down, Macro) dan lighting yang berbeda.`,
      ],
      targetOutput: "5-10 Prompt Teruji Siap Paste",
      completed: false,
      actionUrl: `/prompt?keyword=${kwEnc}&reason=${encodeURIComponent("Target Mingguan Hari Selasa")}&type=photo`,
      actionLabel: "Generate Prompt Sekarang",
      isExternalLink: false,
      tips: "Gunakan tombol 'Salin Prompt' murni agar bersih tanpa teks negatif pengganggu saat dipaste ke Nano Banana.",
    },
    {
      id: `${targetWeekId}-rabu`,
      day: "rabu",
      dayName: "Rabu",
      dayOrder: 3,
      phase: "3. Produksi & QC",
      title: "Produksi Gambar di Nano Banana & Quality Control Anatomi",
      category: "Produksi Gambar AI",
      targetKeyword: trend.keyword,
      actionItems: [
        `Buka Nano Banana / AI Generator Anda, paste prompt hari Selasa satu per satu.`,
        `Set aspek rasio di Nano Banana sesuai rekomendasi pasar (16:9 atau 3:2).`,
        `Lakukan Quality Control (QC) Kepatuhan Adobe Stock:`,
        `  - Periksa tangan & jari: wajib 5 jari sempurna tanpa mutasi.`,
        `  - Periksa wajah & mata: simetris, alami, tanpa distorsi.`,
        `  - Periksa kebersihan: pastikan nol teks, nol logo, dan nol watermark.`,
        `Pilih 5-10 gambar terbaik dan upscale ke resolusi minimal 4000px (4MP+).`,
      ],
      targetOutput: "5-10 Gambar Lolos QC Bebas Cacat Anatomi",
      completed: false,
      actionUrl: `/prompt?keyword=${kwEnc}`,
      actionLabel: "Buka Prompt Generator",
      isExternalLink: false,
      tips: "Kurator Adobe Stock langsung menolak gambar yang tangannya melintir atau memiliki jari 6. Buang gambar yang cacat dan pilih yang sempurna.",
    },
    {
      id: `${targetWeekId}-kamis`,
      day: "kamis",
      dayName: "Kamis",
      dayOrder: 4,
      phase: "4. Metadata SEO",
      title: "Optimasi SEO & Auto-Save ke Koleksi Aset",
      category: "Metadata & Kepatuhan",
      targetKeyword: trend.keyword,
      actionItems: [
        `Buka Generator SEO (/seo) lalu upload gambar hasil produksi hari Rabu (bisa Single atau Bulk).`,
        `Biarkan AI membuatkan Judul deskriptif sentence-case dan 30-49 keywords komersial.`,
        `Periksa 'Checklist Submit Adobe Stock': pastikan bebas nama artis, brand, dan tokoh nyata.`,
        `Aset Anda otomatis tersimpan ke Koleksi Aset (/library) dengan status 🟡 In Review.`,
      ],
      targetOutput: "5-10 Aset Terisi SEO Lengkap di Koleksi",
      completed: false,
      actionUrl: `/seo?keyword=${kwEnc}`,
      actionLabel: "Buka Generator SEO",
      isExternalLink: false,
      tips: "Judul harus berupa kalimat deskriptif natural, jangan tumpukan keyword atau klaim berita nyata.",
    },
    {
      id: `${targetWeekId}-jumat`,
      day: "jumat",
      dayName: "Jumat",
      dayOrder: 5,
      phase: "5. Diversifikasi (Anti-Spam)",
      title: "Diversifikasi Aset: Variasi Sudut & Rasio Vertikal 9:16",
      category: "Anti-Spam Diversification",
      targetKeyword: trend.secondaryKeyword,
      actionItems: [
        `Sesuai Pedoman Adobe Stock, dilarang upload variasi yang hampir identik dari 1 prompt (kebijakan anti-spam).`,
        `Buat 3-5 variasi dengan sudut pandang baru (misal: Flatlay Meja Kerja, Close-up Detail, atau Sudut Lebar).`,
        `Buat juga versi vertikal 9:16 untuk kebutuhan video & konten mobile (Reels/TikTok/Shorts) yang permintaannya sedang meledak.`,
        `Generate SEO untuk variasi baru ini dan simpan ke Koleksi Aset.`,
      ],
      targetOutput: "3-5 Aset Variasi Sudut & Rasio Berbeda",
      completed: false,
      actionUrl: `/prompt?keyword=${kw2Enc}&reason=${encodeURIComponent("Diversifikasi Sudut Anti-Spam")}&type=photo`,
      actionLabel: "Buat Variasi Sudut Baru",
      isExternalLink: false,
      tips: "Variasi sudut yang berbeda nyata melindungi akun Anda dari penolakan spam sekaligus memberi banyak opsi bagi pembeli.",
    },
    {
      id: `${targetWeekId}-sabtu`,
      day: "sabtu",
      dayName: "Sabtu",
      dayOrder: 6,
      phase: "6. Submission",
      title: "Submit ke Portal Adobe Stock & Centang Checkbox Wajib AI",
      category: "Distribusi Microstock",
      targetKeyword: "Batch Koleksi Minggu Ini",
      actionItems: [
        `Buka Portal Kontributor Adobe Stock (contributor.stock.adobe.com/uploads).`,
        `Upload seluruh gambar batch minggu ini yang sudah siap.`,
        `Salin Judul dan Keywords dari Koleksi Aset kita dengan tombol 1-klik copy.`,
        `Wajib centang 2 kotak krusial di portal Adobe Stock:`,
        `  ☑️ Created using generative AI tools`,
        `  ☑️ People and Property are fictional (agar bebas model release)`,
        `Klik Submit untuk mengirim ke antrean peninjauan kurator.`,
      ],
      targetOutput: "100% Aset Minggu Ini Berhasil Di-submit",
      completed: false,
      actionUrl: "https://contributor.stock.adobe.com/uploads",
      actionLabel: "Buka Portal Adobe Stock",
      isExternalLink: true,
      tips: "Centang 'People and Property are fictional' membebaskan Anda dari tuntutan upload surat model release untuk orang/gedung fiktif buatan AI.",
    },
    {
      id: `${targetWeekId}-minggu`,
      day: "minggu",
      dayName: "Minggu",
      dayOrder: 7,
      phase: "7. Evaluasi & Reset",
      title: "Evaluasi Review Tracker, Portofolio & Siapkan Minggu Depan",
      category: "Review & Evaluasi",
      targetKeyword: "Portofolio Tracker",
      actionItems: [
        `Buka Koleksi Aset & Review Tracker (/library).`,
        `Cek notifikasi email atau portal Adobe Stock: tandai aset yang sudah 🟢 Accepted atau 🔴 Rejected.`,
        `Periksa Acceptance Rate portofolio Anda minggu ini. Jika ada yang ditolak, catat alasannya untuk perbaikan.`,
        `Rayakan konsistensi 7 hari Anda! Portofolio microstock yang sukses dibangun dari rutinitas mingguan yang terukur.`,
      ],
      targetOutput: "Koleksi Aset Ter-update & Target Minggu Depan Siap",
      completed: false,
      actionUrl: `/library`,
      actionLabel: "Buka Koleksi & Tracker",
      isExternalLink: false,
      tips: "Konsistensi submit 10-15 aset berkualitas setiap minggu jauh lebih mendatangkan royalti stabil daripada submit 100 aset sekaligus lalu berhenti.",
    },
  ];

  return {
    weekId: targetWeekId,
    weekRangeLabel: range.label,
    mainTheme: trend.keyword,
    category: trend.category,
    weeklyGoal: "Menghasilkan 10-15 aset komersial berkualitas tinggi, lolos kurasi Adobe Stock, dan siap panen royalti.",
    tasks,
    updatedAt: new Date().toISOString(),
  };
}

const STORAGE_PREFIX = "microstock_weekly_plan_";

export function loadWeeklyPlan(weekId?: string): WeeklyPlan {
  if (typeof window === "undefined") {
    return generateDefaultWeeklyPlan(weekId);
  }
  const targetWeekId = weekId || getCurrentWeekId();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${targetWeekId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklyPlan;
      if (parsed && Array.isArray(parsed.tasks) && parsed.tasks.length === 7) {
        return parsed;
      }
    }
  } catch {}

  const newPlan = generateDefaultWeeklyPlan(targetWeekId);
  saveWeeklyPlan(newPlan);
  return newPlan;
}

export function saveWeeklyPlan(plan: WeeklyPlan): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${plan.weekId}`, JSON.stringify(plan));
  } catch (err) {
    console.error("Gagal menyimpan weekly plan ke localStorage:", err);
  }
}

export function toggleTaskCompletion(weekId: string, taskId: string): WeeklyPlan {
  const plan = loadWeeklyPlan(weekId);
  plan.tasks = plan.tasks.map((task) => {
    if (task.id === taskId) {
      const nextCompleted = !task.completed;
      return {
        ...task,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      };
    }
    return task;
  });
  plan.updatedAt = new Date().toISOString();
  saveWeeklyPlan(plan);
  return plan;
}

export function resetWeeklyPlanWithCurrentTrends(weekId?: string): WeeklyPlan {
  const targetWeekId = weekId || getCurrentWeekId();
  const plan = generateDefaultWeeklyPlan(targetWeekId);
  saveWeeklyPlan(plan);
  return plan;
}

